export type IdempotencyResult<T> = { kind: 'new'; value: T } | { kind: 'replay'; value: T }

export class IdempotencyService<T> {
  private readonly values = new Map<string, T>()

  execute(key: string, operation: () => T): IdempotencyResult<T> {
    const existing = this.values.get(key)
    if (existing !== undefined) return { kind: 'replay', value: existing }
    const value = operation()
    this.values.set(key, value)
    return { kind: 'new', value }
  }

  has(key: string): boolean { return this.values.has(key) }
  size(): number { return this.values.size }
}
