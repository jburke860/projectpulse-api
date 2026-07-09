import { describe, expect, it } from 'vitest'
import { getGreeting } from './greeting'

function at(hour: number, minute = 0) {
  return new Date(2026, 6, 9, hour, minute)
}

describe('getGreeting', () => {
  it('greets good morning from 5:00 through 11:59', () => {
    expect(getGreeting(at(5))).toBe('Good morning')
    expect(getGreeting(at(11, 59))).toBe('Good morning')
  })

  it('greets good afternoon from 12:00 through 17:59', () => {
    expect(getGreeting(at(12))).toBe('Good afternoon')
    expect(getGreeting(at(17, 59))).toBe('Good afternoon')
  })

  it('greets good evening from 18:00 onward and before 5:00', () => {
    expect(getGreeting(at(18))).toBe('Good evening')
    expect(getGreeting(at(23, 59))).toBe('Good evening')
    expect(getGreeting(at(0))).toBe('Good evening')
    expect(getGreeting(at(4, 59))).toBe('Good evening')
  })
})
