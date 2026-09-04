import { describe, expect, it } from 'vitest'
import { isConfirmationValid } from '../src/domain/confirmation-policy.js'
import { canTransition, isTerminal, transitionTask } from '../src/domain/task-state-machine.js'

describe('TaskStateMachine', () => {
  it('allows the normal execution path', () => {
    let state = transitionTask('Created', 'Inspecting')
    state = transitionTask(state, 'Queued')
    state = transitionTask(state, 'Executing')
    state = transitionTask(state, 'Verifying')
    state = transitionTask(state, 'Succeeded')
    expect(state).toBe('Succeeded')
    expect(isTerminal(state)).toBe(true)
  })

  it('requires recovery before resuming an interrupted task', () => {
    expect(canTransition('Interrupted', 'Executing')).toBe(false)
    expect(transitionTask('Interrupted', 'Recovering')).toBe('Recovering')
    expect(transitionTask('Recovering', 'RecoveryRequired')).toBe('RecoveryRequired')
  })

  it('rejects transitions out of terminal states', () => {
    expect(() => transitionTask('Succeeded', 'Executing')).toThrow('INVALID_TASK_TRANSITION')
    expect(isTerminal('WaitingUser')).toBe(false)
  })
})

describe('ConfirmationPolicy', () => {
  const token = {
    operationId: 'operation-delete-001',
    resourceId: 'instance-test-001',
    manifestHash: 'sha256:delete-list-001',
    actorId: 'admin-001',
    copyVersion: 'delete-warning-v1',
    issuedAtMs: 1000,
    expiresAtMs: 4000,
  }

  it('accepts a token bound to the exact operation and resource', () => {
    expect(isConfirmationValid(token, { ...token, nowMs: 2000 })).toBe(true)
  })

  it.each([
    ['operationId', { operationId: 'other' }],
    ['resourceId', { resourceId: 'other' }],
    ['manifestHash', { manifestHash: 'other' }],
    ['actorId', { actorId: 'other' }],
    ['copyVersion', { copyVersion: 'old' }],
    ['expired', { nowMs: 4000 }],
  ])('rejects changed %s context', (_reason, change) => {
    expect(isConfirmationValid(token, { ...token, nowMs: 2000, ...change })).toBe(false)
  })
})
