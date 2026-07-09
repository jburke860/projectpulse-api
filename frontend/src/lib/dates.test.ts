import { describe, expect, it } from 'vitest'
import { formatActivityTime } from './dates'

const now = new Date(2026, 6, 9, 15, 0) // Jul 9, 2026 3:00 PM local

describe('formatActivityTime', () => {
  it('labels events from today', () => {
    const result = formatActivityTime(new Date(2026, 6, 9, 14, 30).toISOString(), now)
    expect(result).toMatch(/^Today, /)
  })

  it('labels events from yesterday', () => {
    const result = formatActivityTime(new Date(2026, 6, 8, 22, 15).toISOString(), now)
    expect(result).toMatch(/^Yesterday, /)
  })

  it('uses a short date for older events in the same year', () => {
    const result = formatActivityTime(new Date(2026, 6, 3, 9, 0).toISOString(), now)
    expect(result).toMatch(/Jul 3, /)
    expect(result).not.toMatch(/2026/)
  })

  it('includes the year for events from other years', () => {
    const result = formatActivityTime(new Date(2025, 11, 20, 9, 0).toISOString(), now)
    expect(result).toMatch(/2025/)
  })
})
