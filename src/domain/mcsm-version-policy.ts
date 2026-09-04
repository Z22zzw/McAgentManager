export interface VersionDecision {
  version: string
  certified: boolean
  canWrite: boolean
  reason: 'certified' | 'uncertified-patch' | 'unsupported-line'
}

export function decideMcsmVersion(version: string, certifiedVersions: readonly string[] = ['v10.18.3']): VersionDecision {
  if (certifiedVersions.includes(version)) return { version, certified: true, canWrite: true, reason: 'certified' }
  if (/^v10\.18\.\d+$/.test(version)) return { version, certified: false, canWrite: false, reason: 'uncertified-patch' }
  return { version, certified: false, canWrite: false, reason: 'unsupported-line' }
}
