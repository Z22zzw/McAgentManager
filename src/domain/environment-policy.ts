export interface EnvironmentSnapshot {
  os: string
  version: string
  architecture: string
  fileSystem: string
  mcProcessUid: number
  runnerUid: number
  workspaceWritable: boolean
  auditWritable: boolean
}

export type EnvironmentViolation =
  | 'unsupported-os'
  | 'unsupported-version'
  | 'unsupported-architecture'
  | 'unsupported-filesystem'
  | 'mc-process-root'
  | 'runner-not-dedicated'
  | 'workspace-not-writable'
  | 'audit-not-writable'

export interface EnvironmentCheck {
  supported: boolean
  violations: EnvironmentViolation[]
}

export function checkEnvironment(snapshot: EnvironmentSnapshot): EnvironmentCheck {
  const violations: EnvironmentViolation[] = []
  if (snapshot.os !== 'Ubuntu') violations.push('unsupported-os')
  if (snapshot.version !== '24.04') violations.push('unsupported-version')
  if (snapshot.architecture !== 'x86_64') violations.push('unsupported-architecture')
  if (!['ext4', 'xfs'].includes(snapshot.fileSystem)) violations.push('unsupported-filesystem')
  if (snapshot.mcProcessUid === 0 || snapshot.runnerUid === 0) violations.push('mc-process-root')
  if (snapshot.mcProcessUid !== snapshot.runnerUid) violations.push('runner-not-dedicated')
  if (!snapshot.workspaceWritable) violations.push('workspace-not-writable')
  if (!snapshot.auditWritable) violations.push('audit-not-writable')
  return { supported: violations.length === 0, violations }
}
