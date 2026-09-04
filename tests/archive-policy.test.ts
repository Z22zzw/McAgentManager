import { describe, expect, it } from 'vitest'
import { P0_ARCHIVE_LIMITS, evaluateArchiveBudget } from '../src/domain/archive-budget.js'
import { validateArchiveEntries, validateArchiveEntryPath } from '../src/domain/archive-path-policy.js'

const validMetadata = {
  archiveBytes: 10 * 1024 ** 2,
  extractedBytes: 100 * 1024 ** 2,
  largestEntryBytes: 80 * 1024 ** 2,
  entries: 100,
  deepestPath: 4,
  longestPathBytes: 80,
  compressionRatio: 10,
}

describe('ArchiveBudget', () => {
  it('accepts a bounded archive when peak space is available', () => {
    const result = evaluateArchiveBudget(validMetadata, 6 * 1024 ** 3)
    expect(result.accepted).toBe(true)
    expect(result.violations).toEqual([])
  })

  it.each([
    ['archive-size', { archiveBytes: P0_ARCHIVE_LIMITS.maxArchiveBytes + 1 }],
    ['extracted-size', { extractedBytes: P0_ARCHIVE_LIMITS.maxExtractedBytes + 1 }],
    ['entry-size', { largestEntryBytes: P0_ARCHIVE_LIMITS.maxEntryBytes + 1 }],
    ['entry-count', { entries: P0_ARCHIVE_LIMITS.maxEntries + 1 }],
    ['path-depth', { deepestPath: P0_ARCHIVE_LIMITS.maxDepth + 1 }],
    ['path-length', { longestPathBytes: P0_ARCHIVE_LIMITS.maxPathBytes + 1 }],
    ['compression-ratio', { compressionRatio: P0_ARCHIVE_LIMITS.maxCompressionRatio + 1 }],
  ] as const)('rejects %s limit violations', (violation, change) => {
    const result = evaluateArchiveBudget({ ...validMetadata, ...change }, 6 * 1024 ** 3)
    expect(result.accepted).toBe(false)
    expect(result.violations).toContain(violation)
  })

  it('rejects an archive when peak staging space is insufficient', () => {
    const result = evaluateArchiveBudget(validMetadata, 100 * 1024 ** 2)
    expect(result.accepted).toBe(false)
    expect(result.violations).toContain('space-budget')
  })

  it('rejects unknown extracted size before extraction', () => {
    const result = evaluateArchiveBudget({ ...validMetadata, extractedBytes: null }, 6 * 1024 ** 3)
    expect(result.accepted).toBe(false)
    expect(result.violations).toContain('unknown-extracted-size')
    expect(result.peakRequiredBytes).toBeNull()
  })
})

describe('ArchivePathPolicy', () => {
  it.each([
    ['../../outside.txt', 'traversal'],
    ['/etc/passwd', 'absolute'],
    ['C:/Windows/System32/x', 'absolute'],
    ['normal.txt\0evil', 'invalid'],
  ] as const)('rejects %s', (path, violation) => {
    const result = validateArchiveEntryPath({ path, kind: 'file' })
    expect(result.accepted).toBe(false)
    expect(result.violations).toContain(violation)
  })

  it.each(['symlink', 'hardlink', 'device', 'fifo'] as const)('rejects %s entries', (kind) => {
    const result = validateArchiveEntryPath({ path: 'payload', kind })
    expect(result.accepted).toBe(false)
    expect(result.violations).toContain('special-file')
  })

  it('normalizes a safe relative path', () => {
    expect(validateArchiveEntryPath({ path: 'server/./server.jar', kind: 'file' })).toMatchObject({
      accepted: true,
      normalizedPath: 'server/server.jar',
    })
  })

  it('rejects duplicate normalized entries', () => {
    const results = validateArchiveEntries([
      { path: 'server/./config.txt', kind: 'file' },
      { path: 'server/config.txt', kind: 'file' },
    ])
    expect(results[0]?.accepted).toBe(true)
    expect(results[1]).toEqual({ accepted: false, violations: ['duplicate'] })
  })
})
