export interface ArchiveLimits {
  maxArchiveBytes: number
  maxExtractedBytes: number
  maxEntryBytes: number
  maxEntries: number
  maxDepth: number
  maxPathBytes: number
  maxCompressionRatio: number
  safetyMarginBytes: number
}

export interface ArchiveMetadata {
  archiveBytes: number
  extractedBytes: number | null
  largestEntryBytes: number
  entries: number
  deepestPath: number
  longestPathBytes: number
  compressionRatio: number | null
}

export type BudgetViolation =
  | 'archive-size'
  | 'extracted-size'
  | 'entry-size'
  | 'entry-count'
  | 'path-depth'
  | 'path-length'
  | 'compression-ratio'
  | 'unknown-extracted-size'
  | 'space-budget'

export interface BudgetResult {
  accepted: boolean
  violations: BudgetViolation[]
  peakRequiredBytes: number | null
}

export const P0_ARCHIVE_LIMITS: ArchiveLimits = {
  maxArchiveBytes: 4 * 1024 ** 3,
  maxExtractedBytes: 24 * 1024 ** 3,
  maxEntryBytes: 8 * 1024 ** 3,
  maxEntries: 100_000,
  maxDepth: 32,
  maxPathBytes: 1024,
  maxCompressionRatio: 200,
  safetyMarginBytes: 5 * 1024 ** 3,
}

export function evaluateArchiveBudget(
  metadata: ArchiveMetadata,
  availableBytes: number,
  limits: ArchiveLimits = P0_ARCHIVE_LIMITS,
  javaInstallReserveBytes = 0,
): BudgetResult {
  const violations: BudgetViolation[] = []
  if (metadata.archiveBytes > limits.maxArchiveBytes) violations.push('archive-size')
  if (metadata.extractedBytes === null) violations.push('unknown-extracted-size')
  if (metadata.extractedBytes !== null && metadata.extractedBytes > limits.maxExtractedBytes) violations.push('extracted-size')
  if (metadata.largestEntryBytes > limits.maxEntryBytes) violations.push('entry-size')
  if (metadata.entries > limits.maxEntries) violations.push('entry-count')
  if (metadata.deepestPath > limits.maxDepth) violations.push('path-depth')
  if (metadata.longestPathBytes > limits.maxPathBytes) violations.push('path-length')
  if (metadata.compressionRatio !== null && metadata.compressionRatio > limits.maxCompressionRatio) violations.push('compression-ratio')

  const peakRequiredBytes = metadata.extractedBytes === null
    ? null
    : metadata.archiveBytes + metadata.extractedBytes + javaInstallReserveBytes + limits.safetyMarginBytes
  if (peakRequiredBytes !== null && availableBytes < peakRequiredBytes) violations.push('space-budget')

  return { accepted: violations.length === 0, violations, peakRequiredBytes }
}
