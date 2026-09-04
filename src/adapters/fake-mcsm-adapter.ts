import type { McsmAdapter, McsmInstance } from './mcsm-adapter.js'

export class FakeMcsmAdapter implements McsmAdapter {
  readonly calls: string[] = []
  private readonly instances = new Map<string, McsmInstance>()
  constructor(initial: McsmInstance[] = []) { initial.forEach((instance) => this.instances.set(instance.id, { ...instance })) }

  async listInstances(): Promise<readonly McsmInstance[]> { this.calls.push('listInstances'); return [...this.instances.values()] }
  async getInstance(id: string): Promise<McsmInstance | undefined> { this.calls.push(`getInstance:${id}`); return this.instances.get(id) }
  async createInstance(input: { idempotencyKey: string; name: string; workDirectory: string; port: number }): Promise<McsmInstance> {
    this.calls.push(`createInstance:${input.idempotencyKey}`)
    const instance = { id: `fake-${this.instances.size + 1}`, name: input.name, state: 'stopped' as const, workDirectory: input.workDirectory, port: input.port }
    this.instances.set(instance.id, instance); return instance
  }
  async startInstance(id: string, idempotencyKey: string): Promise<void> { this.calls.push(`startInstance:${id}:${idempotencyKey}`); const instance = this.instances.get(id); if (!instance) throw new Error('MCSM_INSTANCE_NOT_FOUND'); instance.state = 'running' }
  async stopInstance(id: string, idempotencyKey: string): Promise<void> { this.calls.push(`stopInstance:${id}:${idempotencyKey}`); const instance = this.instances.get(id); if (!instance) throw new Error('MCSM_INSTANCE_NOT_FOUND'); instance.state = 'stopped' }
  async readLogs(id: string): Promise<readonly string[]> { this.calls.push(`readLogs:${id}`); return this.instances.has(id) ? [] : Promise.reject(new Error('MCSM_INSTANCE_NOT_FOUND')) }
  async deleteInstance(id: string, idempotencyKey: string): Promise<void> { this.calls.push(`deleteInstance:${id}:${idempotencyKey}`); if (!this.instances.delete(id)) throw new Error('MCSM_INSTANCE_NOT_FOUND') }
}
