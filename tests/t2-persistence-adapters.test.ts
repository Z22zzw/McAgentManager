import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FakeMcsmAdapter } from '../src/adapters/fake-mcsm-adapter.js'
import { assertMcsmInstance } from '../src/adapters/mcsm-adapter.js'
import { TaskRepository } from '../src/persistence/task-repository.js'
import type { PersistedTask } from '../src/persistence/task-types.js'

const task: PersistedTask = { id: 'task-1', kind: 'deploy', actorId: 'admin-1', resourceId: 'instance-1', idempotencyKey: 'idem-1', state: 'Executing', version: 1, createdAtMs: 100, updatedAtMs: 100 }

describe('TaskRepository', () => {
  it('persists tasks atomically and reloads them after a new repository is opened', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mc-ai-manager-'))
    const file = join(directory, 'tasks', 'store.json')
    const first = new TaskRepository(file); await first.open(); await first.saveTask(task)
    const second = new TaskRepository(file); await second.open()
    expect(second.getTask('task-1')).toEqual(task)
    expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({ schemaVersion: 1, tasks: [task] })
  })

  it('rejects an unsupported store schema instead of silently discarding tasks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mc-ai-manager-')); const file = join(directory, 'store.json')
    const { writeFile } = await import('node:fs/promises'); await writeFile(file, JSON.stringify({ schemaVersion: 99 }))
    await expect(new TaskRepository(file).open()).rejects.toThrow('TASK_STORE_SCHEMA_UNSUPPORTED')
  })

  it('does not expose mutable internal task arrays', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mc-ai-manager-')); const repo = new TaskRepository(join(directory, 'store.json')); await repo.open(); await repo.saveTask(task)
    const list = repo.listTasks(); expect(() => (list as PersistedTask[]).pop()).not.toThrow(); expect(repo.listTasks()).toHaveLength(1)
  })
})

describe('McsmAdapter contract seam', () => {
  it('supports the P0 lifecycle with a fake implementation', async () => {
    const adapter = new FakeMcsmAdapter(); const created = await adapter.createInstance({ idempotencyKey: 'idem-1', name: '测试服', workDirectory: '/home/mc-agent/workspaces/test', port: 25565 })
    assertMcsmInstance(created); await adapter.startInstance(created.id, 'op-start'); expect((await adapter.getInstance(created.id))?.state).toBe('running')
    await adapter.stopInstance(created.id, 'op-stop'); expect((await adapter.getInstance(created.id))?.state).toBe('stopped')
    expect(adapter.calls).toEqual(['createInstance:idem-1', `startInstance:${created.id}:op-start`, `getInstance:${created.id}`, `stopInstance:${created.id}:op-stop`, `getInstance:${created.id}`])
  })

  it('rejects malformed external instance data', () => {
    expect(() => assertMcsmInstance({ id: 'x', name: 'x', state: 'running' })).toThrow('MCSM_INVALID_INSTANCE')
    expect(() => assertMcsmInstance({ id: 'x', name: 'x', workDirectory: '/x', state: 'crashed' })).toThrow('MCSM_INVALID_INSTANCE_STATE')
  })
})
