import { describe, expect, it } from 'vitest'
import { formatProjectStatus, projectStatuses, projectStatusTone } from './projectStatus'

describe('projectStatus helpers', () => {
  it('formats OnHold with a space', () => {
    expect(formatProjectStatus('OnHold')).toBe('On Hold')
  })

  it('maps every status to a label and tone', () => {
    for (const status of projectStatuses) {
      expect(formatProjectStatus(status)).toBeTruthy()
      expect(projectStatusTone(status)).toBeTruthy()
    }
  })

  it('falls back to neutral for unknown statuses', () => {
    expect(projectStatusTone('Mystery')).toBe('neutral')
    expect(formatProjectStatus('Mystery')).toBe('Mystery')
  })
})
