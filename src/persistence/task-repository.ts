import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { PersistedStep, PersistedTask, TaskStore } from './task-types.js'

const emptyStore = (): TaskStore => ({ schemaVersion: 1, tasks: [], steps: [] })

export class TaskRepository {
  private store: TaskStore | null = null
  private writeQueue: Promise<void> = Promise.resolve()

  constructor(private readonly filePath: string) {}

  async open(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8')
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || (parsed as { schemaVersion?: unknown }).schemaVersion !== 1) throw new Error('TASK_STORE_SCHEMA_UNSUPPORTED')
      this.store = parsed as TaskStore
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      this.store = emptyStore()
      await this.flush()
    }
  }

  private current(): TaskStore {
    if (!this.store) throw new Error('TASK_REPOSITORY_NOT_OPEN')
    return this.store
  }

  private async flush(): Promise<void> {
    const store = this.current()
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true })
      const tempPath = `${this.filePath}.${process.pid}.tmp`
      await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
      await rename(tempPath, this.filePath)
    })
    return this.writeQueue
  }

  async saveTask(task: PersistedTask): Promise<void> {
    const store = this.current(); const index = store.tasks.findIndex((item) => item.id === task.id)
    if (index < 0) store.tasks.push(task); else store.tasks[index] = task
    await this.flush()
  }

  async saveStep(step: PersistedStep): Promise<void> {
    const store = this.current(); const index = store.steps.findIndex((item) => item.id === step.id)
    if (index < 0) store.steps.push(step); else store.steps[index] = step
    await this.flush()
  }

  getTask(id: string): PersistedTask | undefined { return this.current().tasks.find((task) => task.id === id) }
  listTasks(): readonly PersistedTask[] { return [...this.current().tasks] }
  listSteps(taskId: string): readonly PersistedStep[] { return this.current().steps.filter((step) => step.taskId === taskId) }
}
