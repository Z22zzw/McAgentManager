export interface ConfirmationToken {
  operationId: string
  resourceId: string
  manifestHash: string
  actorId: string
  copyVersion: string
  issuedAtMs: number
  expiresAtMs: number
}

export interface ConfirmationContext {
  operationId: string
  resourceId: string
  manifestHash: string
  actorId: string
  copyVersion: string
  nowMs: number
}

export function isConfirmationValid(token: ConfirmationToken, context: ConfirmationContext): boolean {
  return token.operationId === context.operationId
    && token.resourceId === context.resourceId
    && token.manifestHash === context.manifestHash
    && token.actorId === context.actorId
    && token.copyVersion === context.copyVersion
    && context.nowMs >= token.issuedAtMs
    && context.nowMs < token.expiresAtMs
}
