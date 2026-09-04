export type ExternalFact = 'present' | 'absent' | 'running' | 'stopped' | 'unknown'
export type RecoveryDecision = 'resume' | 'succeeded' | 'recovery-required' | 'failed'

export interface RecoverySnapshot {
  operation: 'create' | 'start' | 'stop' | 'delete'
  requested: ExternalFact
  mcsm: ExternalFact
  process: ExternalFact
  resource: ExternalFact
}

export function reconcile(snapshot: RecoverySnapshot): RecoveryDecision {
  if ([snapshot.mcsm, snapshot.process, snapshot.resource].includes('unknown')) return 'recovery-required'
  if (snapshot.operation === 'create') {
    if (snapshot.mcsm === 'present' && snapshot.resource === 'present') return 'succeeded'
    if (snapshot.mcsm === 'absent' && snapshot.resource === 'absent') return 'resume'
    return 'recovery-required'
  }
  if (snapshot.operation === 'delete') {
    if (snapshot.mcsm === 'absent' && snapshot.resource === 'absent') return 'succeeded'
    if (snapshot.mcsm === 'present' || snapshot.resource === 'present') return 'recovery-required'
    return 'failed'
  }
  if (snapshot.operation === 'start' && snapshot.mcsm === 'running' && snapshot.process === 'running') return 'succeeded'
  if (snapshot.operation === 'stop' && snapshot.mcsm === 'stopped' && snapshot.process === 'stopped') return 'succeeded'
  return 'resume'
}
