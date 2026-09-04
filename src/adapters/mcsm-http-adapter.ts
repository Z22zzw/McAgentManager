import type { HttpTransport } from './http-transport.js'
import { type McsmAdapter, type McsmInstance, type McsmInstanceState } from './mcsm-adapter.js'

export interface McsmApiPaths {
  instances: (daemonId: string) => string
  instance: (id: string, daemonId: string) => string
  create: (daemonId: string) => string
  start: (id: string, daemonId: string) => string
  stop: (id: string, daemonId: string) => string
  logs: (id: string, daemonId: string) => string
  delete: (id: string, daemonId: string) => string
}

const query = (params: Record<string, string | number>): string => new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()

/** Routes verified against MCSManager v10.18.3 frontend service declarations. */
export const DEFAULT_MCSM_PATHS: McsmApiPaths = {
  instances: (daemonId) => `/api/service/remote_service_instances?${query({ daemonId, page: 1, page_size: 100 })}`,
  instance: (id, daemonId) => `/api/instance?${query({ uuid: id, daemonId })}`,
  create: (daemonId) => `/api/instance?${query({ daemonId })}`,
  start: (id, daemonId) => `/api/protected_instance/open?${query({ uuid: id, daemonId })}`,
  stop: (id, daemonId) => `/api/protected_instance/stop?${query({ uuid: id, daemonId })}`,
  logs: (id, daemonId) => `/api/protected_instance/outputlog?${query({ uuid: id, daemonId })}`,
  delete: (_id, daemonId) => `/api/instance?${query({ daemonId })}`,
}

type McsmWireInstance = {
  instanceUuid: string
  status: number
  config: { nickname: string; cwd: string; basePort?: number }
  info?: { allocatedPorts?: { host: string; container: number }[] }
}

function unwrapData(value: unknown): unknown {
  return value && typeof value === 'object' && 'data' in value ? (value as { data: unknown }).data : value
}

function mapStatus(status: number): McsmInstanceState {
  return ({ 0: 'stopped', 1: 'stopping', 2: 'starting', 3: 'running' } as Record<number, McsmInstanceState>)[status] ?? 'unknown'
}

function mapCreatedInstance(value: unknown): McsmInstance {
  const body = unwrapData(value) as { instanceUuid?: unknown; config?: Partial<McsmWireInstance['config']> } | null
  if (!body || typeof body.instanceUuid !== 'string' || !body.config || typeof body.config.nickname !== 'string' || typeof body.config.cwd !== 'string') throw new Error('MCSM_INVALID_CREATE_RESPONSE')
  return { id: body.instanceUuid, name: body.config.nickname, state: 'stopped', workDirectory: body.config.cwd, ...(body.config.basePort === undefined ? {} : { port: body.config.basePort }) }
}

function mapInstance(value: unknown): McsmInstance {
  const wire = unwrapData(value) as Partial<McsmWireInstance> | null
  if (!wire || typeof wire.instanceUuid !== 'string' || !wire.config || typeof wire.config.nickname !== 'string' || typeof wire.config.cwd !== 'string' || typeof wire.status !== 'number') throw new Error('MCSM_INVALID_INSTANCE')
  return { id: wire.instanceUuid, name: wire.config.nickname, state: mapStatus(wire.status), workDirectory: wire.config.cwd, ...(wire.config.basePort === undefined ? {} : { port: wire.config.basePort }) }
}

export class McsmHttpAdapter implements McsmAdapter {
  constructor(private readonly transport: HttpTransport, private readonly daemonId: string, private readonly paths: McsmApiPaths = DEFAULT_MCSM_PATHS) {}

  private async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const response = await this.transport.request({ method, path, ...(body === undefined ? {} : { body }) })
    if (response.status < 200 || response.status >= 300) throw new Error(`MCSM_HTTP_${response.status}`)
    return unwrapData(response.body) as T
  }

  async listInstances(): Promise<readonly McsmInstance[]> {
    const body = await this.request<unknown>('GET', this.paths.instances(this.daemonId))
    const data = Array.isArray(body) ? body : body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data) ? (body as { data: unknown[] }).data : []
    return data.map(mapInstance)
  }

  async getInstance(id: string): Promise<McsmInstance | undefined> {
    const body = await this.request<unknown>('GET', this.paths.instance(id, this.daemonId))
    return body === null || body === undefined ? undefined : mapInstance(body)
  }

  async createInstance(input: { idempotencyKey: string; name: string; workDirectory: string; port: number; startCommand?: string; javaId?: string }): Promise<McsmInstance> {
    // Idempotency is enforced by the control plane before this adapter is called;
    // MCSManager receives only its documented instance configuration shape.
    void input.idempotencyKey
    const config = { nickname: input.name, cwd: input.workDirectory, basePort: input.port, startCommand: input.startCommand ?? '', java: { id: input.javaId ?? '' } }
    return mapCreatedInstance(await this.request<unknown>('POST', this.paths.create(this.daemonId), config))
  }

  async startInstance(id: string, _idempotencyKey: string): Promise<void> { await this.request('GET', this.paths.start(id, this.daemonId)) }
  async stopInstance(id: string, _idempotencyKey: string): Promise<void> { await this.request('GET', this.paths.stop(id, this.daemonId)) }

  async readLogs(id: string, _sinceMs?: number): Promise<readonly string[]> {
    const body = await this.request<unknown>('GET', this.paths.logs(id, this.daemonId))
    if (typeof body === 'string') return body.split(/\r?\n/).filter(Boolean)
    if (Array.isArray(body) && body.every((line): line is string => typeof line === 'string')) return body
    throw new Error('MCSM_INVALID_LOGS')
  }

  async deleteInstance(id: string, idempotencyKey: string): Promise<void> {
    await this.request('DELETE', this.paths.delete(id, this.daemonId), { uuids: [id], deleteFile: true, operationId: idempotencyKey })
  }
}
