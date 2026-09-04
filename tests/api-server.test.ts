import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../src/server.js'

describe('Web API skeleton', () => {
  afterAll(async () => { await app.close() })

  it('returns instance list in the internal product model', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/instances' })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { items: Array<{ id: string; lifecycle: string; health: string }> }
    expect(body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'demo-paper-001', lifecycle: 'RUNNING', health: 'LOCAL_READY' })]))
  })

  it('creates and replays an instance control task for the same idempotency key', async () => {
    const payload = { action: 'RESTART', idempotencyKey: 'restart-demo-1' }
    const response = await app.inject({ method: 'POST', url: '/api/v1/instances/demo-paper-001/actions', payload })
    const replay = await app.inject({ method: 'POST', url: '/api/v1/instances/demo-paper-001/actions', payload })
    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({ taskId: 'task-restart-demo-1', state: 'EXECUTING' })
    expect(replay.json()).toEqual(response.json())
  })

  it('rejects malformed control input and missing deployment idempotency key', async () => {
    const action = await app.inject({ method: 'POST', url: '/api/v1/instances/demo-paper-001/actions', payload: { action: 'DELETE', idempotencyKey: 'bad key' } })
    const deployment = await app.inject({ method: 'POST', url: '/api/v1/deployments/demo', payload: { name: '测试服', loginMode: 'ONLINE', eulaAccepted: true } })
    expect(action.statusCode).toBe(400)
    expect(action.json()).toMatchObject({ code: 'INVALID_REQUEST' })
    expect(deployment.statusCode).toBe(400)
  })

  it('replays a demo deployment by idempotency key', async () => {
    const payload = { name: '幂等测试服', loginMode: 'ONLINE', eulaAccepted: true, idempotencyKey: 'deploy-demo-1' }
    const first = await app.inject({ method: 'POST', url: '/api/v1/deployments/demo', payload })
    const second = await app.inject({ method: 'POST', url: '/api/v1/deployments/demo', payload })
    expect(first.statusCode).toBe(202)
    expect(second.json()).toEqual(first.json())
  })
})
