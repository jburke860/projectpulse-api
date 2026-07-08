import { describe, expect, it } from 'vitest'
import { allowedStatusTransitions, canTransition, formatTaskStatus, taskStatuses } from './tasks'

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
