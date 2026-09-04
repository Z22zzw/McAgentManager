export type McsmInstanceState = 'running' | 'stopped' | 'starting' | 'stopping' | 'unknown'

export interface McsmInstance {
  id: string
  name: string
  state: McsmInstanceState
  workDirectory: string
  port?: number
}

export interface McsmAdapter {
  listInstances(): Promise<readonly McsmInstance[]>
  getInstance(id: string): Promise<McsmInstance | undefined>
  createInstance(input: { idempotencyKey: string; name: string; workDirectory: string; port: number; startCommand?: string; javaId?: string }): Promise<McsmInstance>
  startInstance(id: string, idempotencyKey: string): Promise<void>
  stopInstance(id: string, idempotencyKey: string): Promise<void>
  readLogs(id: string, sinceMs?: number): Promise<readonly string[]>
  deleteInstance(id: string, idempotencyKey: string): Promise<void>
}

export interface McsmContractResponse {
  ok: boolean
  status: number
  body: unknown
}

export function assertMcsmInstance(value: unknown): asserts value is McsmInstance {
  if (!value || typeof value !== 'object') throw new Error('MCSM_INVALID_INSTANCE')
  const instance = value as Partial<McsmInstance>
  if (typeof instance.id !== 'string' || typeof instance.name !== 'string' || typeof instance.workDirectory !== 'string') throw new Error('MCSM_INVALID_INSTANCE')
  if (!['running', 'stopped', 'starting', 'stopping', 'unknown'].includes(instance.state ?? '')) throw new Error('MCSM_INVALID_INSTANCE_STATE')
}
