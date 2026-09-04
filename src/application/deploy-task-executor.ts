import { transitionTask, type TaskState } from '../domain/task-state-machine.js'
import type { AuditService } from '../domain/audit-service.js'
import type { McsmAdapter, McsmInstance } from '../adapters/mcsm-adapter.js'
import type { TaskRepository } from '../persistence/task-repository.js'
import type { PersistedStep, PersistedTask } from '../persistence/task-types.js'

export interface ReadinessVerifier {
  verify(instance: McsmInstance): Promise<{ ready: boolean; processRunning: boolean; portListening: boolean; evidence: string[] }>
}

export interface DeployInput {
  taskId: string
  actorId: string
  idempotencyKey: string
  name: string
  workDirectory: string
  port: number
  javaId: string
}

export interface DeployResult {
  task: PersistedTask
  instance?: McsmInstance
  evidence: string[]
}

export class DeployTaskExecutor {
  constructor(private readonly repository: TaskRepository, private readonly mcsm: McsmAdapter, private readonly readiness: ReadinessVerifier, private readonly audit: AuditService) {}

  private async save(task: PersistedTask, state: TaskState): Promise<PersistedTask> {
    const next = { ...task, state, version: task.version + 1, updatedAtMs: Date.now() }
    await this.repository.saveTask(next); return next
  }

  async run(input: DeployInput): Promise<DeployResult> {
    let task: PersistedTask = { id: input.taskId, kind: 'deploy', actorId: input.actorId, resourceId: input.workDirectory, idempotencyKey: input.idempotencyKey, state: 'Created', version: 0, createdAtMs: Date.now(), updatedAtMs: Date.now() }
    await this.repository.saveTask(task)
    this.audit.append({ id: `${input.taskId}:requested`, taskId: input.taskId, actorId: input.actorId, type: 'requested', summary: `deploy ${input.name}`, atMs: Date.now() })
    task = await this.save(task, 'Inspecting')
    const step: PersistedStep = { id: `${input.taskId}:create`, taskId: input.taskId, operationId: `${input.taskId}:create`, state: 'running', attempt: 1, inputSummary: `create ${input.name}`, updatedAtMs: Date.now() }
    await this.repository.saveStep(step)
    task = await this.save(task, 'Queued'); task = await this.save(task, 'Executing')
    let instance: McsmInstance
    try {
      instance = await this.mcsm.createInstance({ idempotencyKey: input.idempotencyKey, name: input.name, workDirectory: input.workDirectory, port: input.port, javaId: input.javaId })
      await this.repository.saveStep({ ...step, state: 'succeeded', verificationSummary: `instance:${instance.id}`, updatedAtMs: Date.now() })
      await this.mcsm.startInstance(instance.id, `${input.taskId}:start`)
    } catch (error) {
      await this.repository.saveStep({ ...step, state: 'unknown', verificationSummary: String(error), updatedAtMs: Date.now() })
      task = await this.save(task, 'Interrupted')
      task = await this.save(task, 'Recovering')
      task = await this.save(task, 'RecoveryRequired')
      this.audit.append({ id: `${input.taskId}:recovery`, taskId: input.taskId, actorId: input.actorId, type: 'blocked', summary: 'deployment requires external state reconciliation', atMs: Date.now() })
      return { task, evidence: ['外部调用结果无法确认，任务进入需要核对'] }
    }

    task = await this.save(task, 'Verifying')
    const verification = await this.readiness.verify(instance)
    const finalState: TaskState = verification.ready && verification.processRunning && verification.portListening ? 'Succeeded' : 'Partial'
    task = await this.save(task, finalState)
    await this.repository.saveStep({ id: `${input.taskId}:verify`, taskId: input.taskId, operationId: `${input.taskId}:verify`, state: verification.ready ? 'succeeded' : 'failed', attempt: 1, inputSummary: `verify ${instance.id}`, verificationSummary: verification.evidence.join('; '), updatedAtMs: Date.now() })
    this.audit.append({ id: `${input.taskId}:verification`, taskId: input.taskId, actorId: input.actorId, type: 'verification', summary: `deployment ${finalState}`, details: { evidence: verification.evidence.join('; ') }, atMs: Date.now() })
    return { task, instance, evidence: verification.evidence }
  }
}
