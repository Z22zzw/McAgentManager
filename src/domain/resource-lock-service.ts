export type LockResource = `instance:${string}` | 'global:disk'

export interface ResourceLock {
  resource: LockResource
  taskId: string
  leaseId: string
}

export class ResourceLockService {
  private readonly locks = new Map<LockResource, ResourceLock>()

  acquire(resource: LockResource, taskId: string, leaseId: string): ResourceLock {
    const held = this.locks.get(resource)
    if (held && held.taskId !== taskId) throw new Error(`RESOURCE_LOCKED:${resource}`)
    const lock = { resource, taskId, leaseId }
    this.locks.set(resource, lock)
    return lock
  }

  release(resource: LockResource, taskId: string, leaseId: string): void {
    const held = this.locks.get(resource)
    if (!held) return
    if (held.taskId !== taskId || held.leaseId !== leaseId) throw new Error(`LOCK_OWNER_MISMATCH:${resource}`)
    this.locks.delete(resource)
  }

  inspect(resource: LockResource): ResourceLock | undefined { return this.locks.get(resource) }
}
