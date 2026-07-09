import { describe, expect, it } from 'vitest'
import { hashString, initialsFor } from './avatar'

describe('initialsFor', () => {
  it('uses first and last name initials', () => {
    expect(initialsFor('Jeremy Burke')).toBe('JB')
    expect(initialsFor('Maya Anne Singh')).toBe('MS')
  })

  it('uses the first two letters of a single name', () => {
    expect(initialsFor('Jeremy')).toBe('JE')
  })

  it('handles empty and whitespace-only names', () => {
    expect(initialsFor('')).toBe('?')
    expect(initialsFor('   ')).toBe('?')
  })
})

describe('hashString', () => {
  it('is stable and non-negative', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('abc')).toBeGreaterThanOrEqual(0)
    expect(hashString('a-very-long-string-that-overflows-32-bit-math-eventually')).toBeGreaterThanOrEqual(0)
  })
})
