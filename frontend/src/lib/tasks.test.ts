import { describe, expect, it } from 'vitest'
import {
  allowedStatusTransitions,
  canTransition,
  formatTaskStatus,
  isTaskOverdue,
  taskStatuses,
} from './tasks'

describe('canTransition', () => {
  it('allows staying in the same status', () => {
    for (const status of taskStatuses) {
      expect(canTransition(status, status)).toBe(true)
    }
  })

  it('follows the documented workflow', () => {
    expect(canTransition('Open', 'InProgress')).toBe(true)
    expect(canTransition('InProgress', 'InReview')).toBe(true)
    expect(canTransition('InReview', 'Done')).toBe(true)
    expect(canTransition('Cancelled', 'Open')).toBe(true)
  })

  it('blocks invalid jumps', () => {
    expect(canTransition('Open', 'Done')).toBe(false)
    expect(canTransition('Done', 'Open')).toBe(false)
    expect(canTransition('Done', 'Cancelled')).toBe(false)
    expect(canTransition('Cancelled', 'Done')).toBe(false)
  })

  it('has a transition entry for every status', () => {
    for (const status of taskStatuses) {
      expect(allowedStatusTransitions[status]).toBeDefined()
    }
  })
})

describe('formatTaskStatus', () => {
  it('adds spaces to camel-cased statuses', () => {
    expect(formatTaskStatus('InProgress')).toBe('In Progress')
    expect(formatTaskStatus('InReview')).toBe('In Review')
    expect(formatTaskStatus('Open')).toBe('Open')
  })

  it('passes unknown statuses through', () => {
    expect(formatTaskStatus('Archived')).toBe('Archived')
  })
})

describe('isTaskOverdue', () => {
  const now = new Date(2026, 6, 9, 15, 0)

  it('is overdue when due before today and still active', () => {
    expect(isTaskOverdue({ dueDateUtc: new Date(2026, 6, 8).toISOString(), status: 'Open' }, now)).toBe(true)
    expect(isTaskOverdue({ dueDateUtc: new Date(2026, 6, 1).toISOString(), status: 'InProgress' }, now)).toBe(true)
  })

  it('is not overdue when due today or later', () => {
    expect(isTaskOverdue({ dueDateUtc: new Date(2026, 6, 9, 8, 0).toISOString(), status: 'Open' }, now)).toBe(false)
    expect(isTaskOverdue({ dueDateUtc: new Date(2026, 6, 15).toISOString(), status: 'Open' }, now)).toBe(false)
  })

  it('never flags finished or cancelled tasks', () => {
    expect(isTaskOverdue({ dueDateUtc: new Date(2026, 6, 1).toISOString(), status: 'Done' }, now)).toBe(false)
    expect(isTaskOverdue({ dueDateUtc: new Date(2026, 6, 1).toISOString(), status: 'Cancelled' }, now)).toBe(false)
  })

  it('never flags tasks without a due date', () => {
    expect(isTaskOverdue({ dueDateUtc: null, status: 'Open' }, now)).toBe(false)
  })
})
