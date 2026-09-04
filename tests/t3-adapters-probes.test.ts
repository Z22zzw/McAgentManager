import { mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { McsmHttpAdapter } from '../src/adapters/mcsm-http-adapter.js'
import type { HttpRequest, HttpResponse, HttpTransport } from '../src/adapters/http-transport.js'
import { NodeFileProbe, ExecJavaProbe, ProcProcessProbe } from '../src/probes/node-fact-probes.js'

class RecordingTransport implements HttpTransport {
  readonly requests: HttpRequest[] = []
  constructor(private readonly responses: HttpResponse[]) {}
  async request(request: HttpRequest): Promise<HttpResponse> { this.requests.push(request); return this.responses[Math.min(this.requests.length - 1, this.responses.length - 1)]! }
}

const wireInstance = { instanceUuid: 'mcs-1', status: 0, config: { nickname: '测试服', cwd: '/home/mc-agent/workspaces/test', basePort: 25565 } }
const instance = { id: 'mcs-1', name: '测试服', state: 'stopped' as const, workDirectory: '/home/mc-agent/workspaces/test', port: 25565 }

describe('McsmHttpAdapter', () => {
  it('maps the v10.18.3 remote instance route and does not embed credentials', async () => {
    const transport = new RecordingTransport([{ status: 200, body: { data: [wireInstance] } }]); const adapter = new McsmHttpAdapter(transport, 'daemon-1')
    expect(await adapter.listInstances()).toEqual([instance])
    expect(transport.requests[0]).toMatchObject({ method: 'GET', path: '/api/service/remote_service_instances?daemonId=daemon-1&page=1&page_size=100' })
    expect(transport.requests[0]).not.toHaveProperty('body.token')
  })

  it('maps documented create and protected lifecycle routes', async () => {
    const created = { instanceUuid: 'mcs-1', config: { nickname: '测试服', cwd: '/tmp/test', basePort: 25565 } }
    const transport = new RecordingTransport([{ status: 200, body: created }, { status: 200, body: {} }, { status: 200, body: {} }, { status: 200, body: {} }]); const adapter = new McsmHttpAdapter(transport, 'daemon-1')
    expect(await adapter.createInstance({ idempotencyKey: 'create-1', name: '测试服', workDirectory: '/tmp/test', port: 25565 })).toMatchObject({ id: 'mcs-1', state: 'stopped' })
    await adapter.startInstance('mcs-1', 'start-1'); await adapter.stopInstance('mcs-1', 'stop-1'); await adapter.deleteInstance('mcs-1', 'delete-1')
    expect(transport.requests.map((request) => request.method)).toEqual(['POST', 'GET', 'GET', 'DELETE'])
    expect(transport.requests[1]?.path).toBe('/api/protected_instance/open?uuid=mcs-1&daemonId=daemon-1')
    expect(transport.requests[2]?.path).toBe('/api/protected_instance/stop?uuid=mcs-1&daemonId=daemon-1')
    expect(transport.requests[3]?.body).toMatchObject({ uuids: ['mcs-1'], deleteFile: true, operationId: 'delete-1' })
  })

  it('maps the string outputlog response and rejects malformed responses', async () => {
    const logTransport = new RecordingTransport([{ status: 200, body: { data: 'line one\nline two\n' } }]); const adapter = new McsmHttpAdapter(logTransport, 'daemon-1')
    expect(await adapter.readLogs('mcs-1')).toEqual(['line one', 'line two'])
    await expect(new McsmHttpAdapter(new RecordingTransport([{ status: 503, body: null }]), 'daemon-1').listInstances()).rejects.toThrow('MCSM_HTTP_503')
    await expect(new McsmHttpAdapter(new RecordingTransport([{ status: 200, body: { data: [{ ...wireInstance, status: 9 }] } }]), 'daemon-1').listInstances()).resolves.toEqual([{ ...instance, state: 'unknown' }])
  })
})

describe('Node fact probes', () => {
  it('reports files and symlinks without following the link', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mc-ai-probe-')); const file = join(root, 'file.txt'); const link = join(root, 'link')
    await writeFile(file, 'fixture'); await symlink(file, link)
    const probe = new NodeFileProbe(); expect(await probe.inspect(file)).toMatchObject({ exists: true, isSymlink: false, bytes: 7 }); expect(await probe.inspect(link)).toMatchObject({ exists: true, isSymlink: true }); expect(await probe.inspect(join(root, 'missing'))).toMatchObject({ exists: false })
  })

  it('can inspect the current Node runtime as a process and Java executable', async () => {
    const processFacts = await new ProcProcessProbe().inspect(globalThis.process.pid)
    expect(processFacts.running).toBe(true)
    const java = await new ExecJavaProbe().inspect('java'); expect(java.executable).toBe('java')
    expect(java.major).toBeGreaterThan(0)
  })
})
