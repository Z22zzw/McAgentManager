import { posix } from 'node:path'

export type ArchiveEntryKind = 'file' | 'directory' | 'symlink' | 'hardlink' | 'device' | 'fifo'

export interface ArchiveEntry {
  path: string
  kind: ArchiveEntryKind
}

export type PathViolation = 'absolute' | 'traversal' | 'invalid' | 'special-file' | 'outside-root' | 'duplicate'

export interface PathPolicyResult {
  accepted: boolean
  violations?: PathViolation[]
  normalizedPath?: string
}

function pathBytes(value: string): number {
  return new TextEncoder().encode(value).length
}

export function validateArchiveEntryPath(
  entry: ArchiveEntry,
  root = '/tmp/archive-task',
  maxPathBytes = 1024,
): PathPolicyResult {
  const violations: PathViolation[] = []
  const raw = entry.path.replaceAll('\\', '/')
  if (raw.includes('\0') || pathBytes(raw) > maxPathBytes) violations.push('invalid')
  if (raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) violations.push('absolute')
  const normalized = posix.normalize(raw)
  if (normalized === '..' || normalized.startsWith('../')) violations.push('traversal')
  if (entry.kind !== 'file' && entry.kind !== 'directory') violations.push('special-file')
  const resolved = posix.resolve(root, normalized)
  if (resolved !== root && !resolved.startsWith(`${root}/`)) violations.push('outside-root')
  return violations.length === 0 ? { accepted: true, normalizedPath: normalized } : { accepted: false, violations }
}

export function validateArchiveEntries(entries: ArchiveEntry[], root?: string, maxPathBytes?: number): PathPolicyResult[] {
  const seen = new Set<string>()
  return entries.map((entry) => {
    const result = validateArchiveEntryPath(entry, root, maxPathBytes)
    if (result.accepted && result.normalizedPath && seen.has(result.normalizedPath)) return { accepted: false, violations: ['duplicate'] }
    if (result.accepted && result.normalizedPath) seen.add(result.normalizedPath)
    return result
  })
}
