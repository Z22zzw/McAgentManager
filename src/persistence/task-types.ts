import type { TaskState } from '../domain/task-state-machine.js'

export interface PersistedTask {
  id: string
  kind: string
  actorId: string
  resourceId?: string
  idempotencyKey: string
  state: TaskState
  version: number
  createdAtMs: number
  updatedAtMs: number
}

export interface PersistedStep {
  id: string
  taskId: string
  operationId: string
  state: 'pending' | 'running' | 'succeeded' | 'failed' | 'unknown'
  attempt: number
  inputSummary: string
  verificationSummary?: string
  updatedAtMs: number
}

export interface TaskStore {
  schemaVersion: 1
  tasks: PersistedTask[]
  steps: PersistedStep[]
}
