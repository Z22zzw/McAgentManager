import type { AuditService } from './audit-service.js'
import type { ResourceLockService, LockResource } from './resource-lock-service.js'
import type { VersionDecision } from './mcsm-version-policy.js'

export type OperationRisk = 'read' | 'reversible' | 'service-impact' | 'destructive' | 'host-level'
export interface OperationRequest {
  taskId: string
  operationId: string
  actorId: string
  resource: LockResource
  risk: OperationRisk
  action: 'read' | 'start' | 'stop' | 'delete'
  idempotencyKey: string
  certifiedMcsManager: VersionDecision
}

export interface OperationResult { operationId: string; accepted: true; action: OperationRequest['action'] }

export class OperationGateway {
  constructor(private readonly locks: ResourceLockService, private readonly audit: AuditService) {}

  authorize(request: OperationRequest): void {
    if (!request.certifiedMcsManager.canWrite && request.action !== 'read') throw new Error('MCS_VERSION_NOT_CERTIFIED')
    if (request.risk === 'destructive' && request.action !== 'delete') throw new Error('RISK_ACTION_MISMATCH')
    if (request.action === 'delete' && request.risk !== 'destructive') throw new Error('DELETE_MUST_BE_DESTRUCTIVE')
    if (!request.taskId || !request.operationId || !request.idempotencyKey) throw new Error('OPERATION_CONTEXT_REQUIRED')
  }

  start(request: OperationRequest): OperationResult {
    this.authorize(request)
    this.locks.acquire(request.resource, request.taskId, request.operationId)
    try {
      this.audit.append({ id: `${request.operationId}:start`, taskId: request.taskId, operationId: request.operationId, actorId: request.actorId, type: 'execution-started', summary: `${request.action} ${request.resource}`, atMs: Date.now() })
      return { operationId: request.operationId, accepted: true, action: request.action }
    } catch (error) {
      this.locks.release(request.resource, request.taskId, request.operationId)
      throw error
    }
  }

  finish(request: OperationRequest, result: string): void {
    this.audit.append({ id: `${request.operationId}:result`, taskId: request.taskId, operationId: request.operationId, actorId: request.actorId, type: 'execution-result', summary: result, atMs: Date.now() })
    this.locks.release(request.resource, request.taskId, request.operationId)
  }
}
