import { describe, expect, it } from 'vitest'
import { AuditService } from '../src/domain/audit-service.js'
import { checkEnvironment } from '../src/domain/environment-policy.js'
import { IdempotencyService } from '../src/domain/idempotency-service.js'
import { decideMcsmVersion } from '../src/domain/mcsm-version-policy.js'
import { OperationGateway, type OperationRequest } from '../src/domain/operation-gateway.js'
import { reconcile } from '../src/domain/recovery-reconciler.js'
import { ResourceLockService } from '../src/domain/resource-lock-service.js'

const env = { os: 'Ubuntu', version: '24.04', architecture: 'x86_64', fileSystem: 'ext4', mcProcessUid: 1001, runnerUid: 1001, workspaceWritable: true, auditWritable: true }
const request: OperationRequest = { taskId: 'task-1', operationId: 'op-1', actorId: 'admin-1', resource: 'instance:one', risk: 'service-impact', action: 'start', idempotencyKey: 'idem-1', certifiedMcsManager: decideMcsmVersion('v10.18.3') }

describe('EnvironmentPolicy and McsmVersionPolicy', () => {
  it('accepts the frozen P0 environment', () => expect(checkEnvironment(env).supported).toBe(true))
  it.each([
    ['os', { os: 'Debian' }],
    ['architecture', { architecture: 'arm64' }],
    ['filesystem', { fileSystem: 'overlayfs' }],
    ['root game process', { mcProcessUid: 0 }],
  ])('rejects an unsafe %s', (_name, change) => expect(checkEnvironment({ ...env, ...change }).supported).toBe(false))
  it('allows writes only for certified versions', () => {
    expect(decideMcsmVersion('v10.18.3').canWrite).toBe(true)
    expect(decideMcsmVersion('v10.18.2').canWrite).toBe(false)
    expect(decideMcsmVersion('v10.17.9').reason).toBe('unsupported-line')
  })
})

describe('Idempotency and ResourceLock', () => {
  it('runs an idempotent operation only once', () => {
    const service = new IdempotencyService<number>(); let calls = 0
    expect(service.execute('same', () => ++calls)).toEqual({ kind: 'new', value: 1 })
    expect(service.execute('same', () => ++calls)).toEqual({ kind: 'replay', value: 1 })
    expect(calls).toBe(1)
  })
  it('prevents a different task from taking a held resource', () => {
    const locks = new ResourceLockService(); locks.acquire('instance:one', 'task-1', 'op-1')
    expect(() => locks.acquire('instance:one', 'task-2', 'op-2')).toThrow('RESOURCE_LOCKED')
    expect(() => locks.release('instance:one', 'task-2', 'op-2')).toThrow('LOCK_OWNER_MISMATCH')
  })
})

describe('OperationGateway and AuditService', () => {
  it('requires a certified MCSManager version and records safe execution', () => {
    const audit = new AuditService(); const gateway = new OperationGateway(new ResourceLockService(), audit)
    expect(gateway.start(request)).toMatchObject({ accepted: true, action: 'start' })
    gateway.finish(request, 'completed token=secret-123')
    expect(audit.list().at(-1)?.summary).toContain('token=[REDACTED]')
  })
  it('blocks writes against an uncertified MCSManager version', () => {
    const audit = new AuditService(); const gateway = new OperationGateway(new ResourceLockService(), audit)
    expect(() => gateway.start({ ...request, certifiedMcsManager: decideMcsmVersion('v10.18.2') })).toThrow('MCS_VERSION_NOT_CERTIFIED')
  })
  it('blocks destructive action with the wrong risk classification', () => {
    const gateway = new OperationGateway(new ResourceLockService(), new AuditService())
    expect(() => gateway.start({ ...request, action: 'delete', risk: 'service-impact' })).toThrow('DELETE_MUST_BE_DESTRUCTIVE')
  })
  it('does not leave a lock when the audit sink is unavailable', () => {
    const locks = new ResourceLockService(); const gateway = new OperationGateway(locks, new AuditService(false))
    expect(() => gateway.start(request)).toThrow('AUDIT_UNAVAILABLE')
    expect(locks.inspect(request.resource)).toBeUndefined()
  })
})

describe('RecoveryReconciler', () => {
  it('succeeds after a lost create response when the instance and directory exist', () => expect(reconcile({ operation: 'create', requested: 'present', mcsm: 'present', process: 'stopped', resource: 'present' })).toBe('succeeded'))
  it('never replays an uncertain destructive operation', () => expect(reconcile({ operation: 'delete', requested: 'absent', mcsm: 'unknown', process: 'stopped', resource: 'present' })).toBe('recovery-required'))
  it('resumes a start only when no external state is known yet', () => expect(reconcile({ operation: 'start', requested: 'running', mcsm: 'stopped', process: 'stopped', resource: 'present' })).toBe('resume'))
})
