import { describe, expect, it } from 'vitest'
import { dateKey, getMonthGrid, isSameDay, monthLabel } from './calendar'

describe('getMonthGrid', () => {
  it('always returns 42 cells starting on a Sunday', () => {
    for (const [year, month] of [
      [2026, 6], // July 2026
      [2026, 1], // February 2026 (starts on a Sunday)
      [2024, 1], // leap February
      [2026, 11], // December (year boundary)
    ] as const) {
      const grid = getMonthGrid(year, month)
      expect(grid).toHaveLength(42)
      expect(grid[0].getDay()).toBe(0)
      // Consecutive calendar days, no gaps (robust across DST shifts).
      for (let index = 1; index < grid.length; index += 1) {
        const expected = new Date(grid[index - 1])
        expected.setDate(expected.getDate() + 1)
        expect(dateKey(grid[index])).toBe(dateKey(expected))
      }
    }
  })

  it('covers every day of the target month', () => {
    const grid = getMonthGrid(2026, 6) // July 2026 has 31 days
    const julyDays = grid.filter((day) => day.getMonth() === 6)
    expect(julyDays).toHaveLength(31)
    expect(julyDays[0].getDate()).toBe(1)
    expect(julyDays[30].getDate()).toBe(31)
  })
})

describe('dateKey', () => {
  it('formats a local YYYY-MM-DD key with zero padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('isSameDay', () => {
  it('compares calendar days, not timestamps', () => {
    expect(isSameDay(new Date(2026, 6, 9, 0, 1), new Date(2026, 6, 9, 23, 59))).toBe(true)
    expect(isSameDay(new Date(2026, 6, 9), new Date(2026, 6, 10))).toBe(false)
  })
})

describe('monthLabel', () => {
  it('names the month and year', () => {
    expect(monthLabel(2026, 6)).toMatch(/July 2026/)
  })
})
