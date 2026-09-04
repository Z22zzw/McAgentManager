export type TaskState = 'Created' | 'Inspecting' | 'WaitingUser' | 'Queued' | 'Executing' | 'Verifying' | 'Succeeded' | 'Partial' | 'Failed' | 'Cancelled' | 'Interrupted' | 'Recovering' | 'RecoveryRequired'

const transitions: Record<TaskState, readonly TaskState[]> = {
  Created: ['Inspecting', 'Cancelled'],
  Inspecting: ['WaitingUser', 'Queued', 'Failed', 'Cancelled'],
  WaitingUser: ['Queued', 'Cancelled', 'Interrupted'],
  Queued: ['Executing', 'Cancelled'],
  Executing: ['Verifying', 'Failed', 'Interrupted'],
  Verifying: ['Succeeded', 'Partial', 'Failed', 'Interrupted'],
  Interrupted: ['Recovering'],
  Recovering: ['Executing', 'WaitingUser', 'RecoveryRequired', 'Failed'],
  RecoveryRequired: ['Recovering', 'Failed'],
  Succeeded: [],
  Partial: [],
  Failed: [],
  Cancelled: [],
}

export function canTransition(from: TaskState, to: TaskState): boolean {
  return transitions[from].includes(to)
}

export function transitionTask(from: TaskState, to: TaskState): TaskState {
  if (!canTransition(from, to)) throw new Error(`INVALID_TASK_TRANSITION:${from}->${to}`)
  return to
}

export function isTerminal(state: TaskState): boolean {
  return ['Succeeded', 'Partial', 'Failed', 'Cancelled', 'RecoveryRequired'].includes(state)
}
