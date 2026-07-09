import { describe, expect, it } from 'vitest'
import { presenceFor, presenceTone } from './presence'

describe('presenceFor', () => {
  it('is deterministic for the same user id', () => {
    expect(presenceFor('user-1')).toBe(presenceFor('user-1'))
    expect(presenceFor('user-2')).toBe(presenceFor('user-2'))
  })

  it('always reports the current session user as online', () => {
    // Find an id that would not otherwise be online, then confirm the override.
    const ids = Array.from({ length: 50 }, (_, index) => `user-${index}`)
    const offlineId = ids.find((id) => presenceFor(id) !== 'online')
    expect(offlineId).toBeDefined()
    expect(presenceFor(offlineId!, offlineId!)).toBe('online')
  })

  it('only produces known presence values', () => {
    for (let index = 0; index < 30; index += 1) {
      const presence = presenceFor(`user-${index}`)
      expect(Object.keys(presenceTone)).toContain(presence)
    }
  })
})
