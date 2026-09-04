import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FakeMcsmAdapter } from '../src/adapters/fake-mcsm-adapter.js'
import { AuditService } from '../src/domain/audit-service.js'
import { DeployTaskExecutor, type ReadinessVerifier } from '../src/application/deploy-task-executor.js'
import { TaskRepository } from '../src/persistence/task-repository.js'

class ReadyProbe implements ReadinessVerifier {
  constructor(private readonly ready: boolean) {}
  async verify(instance: { id: string }) { return { ready: this.ready, processRunning: this.ready, portListening: this.ready, evidence: [`instance:${instance.id}`, this.ready ? 'service-ready' : 'service-not-ready'] } }
}

const input = { taskId: 'task-deploy-1', actorId: 'admin-1', idempotencyKey: 'deploy-1', name: '测试服', workDirectory: '/home/mc-agent/workspaces/test', port: 25565, javaId: '/usr/lib/jvm/java-17/bin/java' }

async function makeExecutor(ready = true) {
  const dir = await mkdtemp(join(tmpdir(), 'mc-ai-t4-'))
  const repo = new TaskRepository(join(dir, 'tasks.json'))
  await repo.open()
  const mcsm = new FakeMcsmAdapter()
  const audit = new AuditService()
  return { repo, mcsm, audit, executor: new DeployTaskExecutor(repo, mcsm, new ReadyProbe(ready), audit) }
}

describe('DeployTaskExecutor', () => {
  it('persists phases and succeeds only after independent readiness facts', async () => {
    const { executor, repo, audit, mcsm } = await makeExecutor()
    const result = await executor.run(input)
    expect(result.task.state).toBe('Succeeded')
    expect(repo.getTask(input.taskId)?.state).toBe('Succeeded')
    expect(repo.listSteps(input.taskId).map((step) => step.state)).toEqual(['succeeded', 'succeeded'])
    expect(mcsm.calls).toEqual(['createInstance:deploy-1', 'startInstance:fake-1:task-deploy-1:start'])
    expect(audit.list().map((event) => event.type)).toEqual(['requested', 'verification'])
  })

  it('reports Partial when readiness cannot be verified', async () => {
    const { executor, repo } = await makeExecutor(false)
    const result = await executor.run(input)
    expect(result.task.state).toBe('Partial')
    expect(repo.getTask(input.taskId)?.state).toBe('Partial')
    expect(result.evidence).toContain('service-not-ready')
  })

  it('moves an uncertain external failure into RecoveryRequired without replaying', async () => {
    const { executor, repo, mcsm } = await makeExecutor()
    const originalStart = mcsm.startInstance.bind(mcsm)
    mcsm.startInstance = async (...args) => { await originalStart(...args); throw new Error('response lost after side effect') }
    const result = await executor.run(input)
    expect(result.task.state).toBe('RecoveryRequired')
    expect(repo.listSteps(input.taskId)[0]?.state).toBe('unknown')
    expect(mcsm.calls.filter((call) => call.startsWith('createInstance')).length).toBe(1)
    expect(mcsm.calls.filter((call) => call.startsWith('startInstance')).length).toBe(1)
  })

  it('does not claim success when create returns malformed data', async () => {
    const { executor, mcsm } = await makeExecutor()
    mcsm.createInstance = async () => { throw new Error('MCSM_INVALID_CREATE_RESPONSE') }
    const result = await executor.run(input)
    expect(result.task.state).toBe('RecoveryRequired')
    expect(result.instance).toBeUndefined()
  })
})
