export type AuditEventType = 'requested' | 'confirmation' | 'execution-started' | 'execution-result' | 'verification' | 'blocked'

export interface AuditEvent {
  id: string
  taskId: string
  operationId?: string
  actorId: string
  type: AuditEventType
  summary: string
  details?: Record<string, string>
  atMs: number
}

function redact(value: string): string {
  return value
    .replace(/(token|password|secret|cookie)\s*[=:]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
}

export class AuditService {
  private readonly events: AuditEvent[] = []
  constructor(private readonly writable = true) {}

  append(event: AuditEvent): AuditEvent {
    if (!this.writable) throw new Error('AUDIT_UNAVAILABLE')
    const safe: AuditEvent = { ...event, summary: redact(event.summary), ...(event.details ? { details: Object.fromEntries(Object.entries(event.details).map(([k, v]) => [k, redact(v)])) } : {}) }
    this.events.push(safe)
    return safe
  }

  list(): readonly AuditEvent[] { return this.events }
}
