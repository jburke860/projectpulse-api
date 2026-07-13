import { describe, expect, it } from 'vitest'
import {
  lightenColor,
  projectColorOptions,
  projectIconByName,
  projectIconOptions,
} from './projectIcons'

describe('projectIconByName', () => {
  it('resolves every catalog entry', () => {
    for (const option of projectIconOptions) {
      expect(projectIconByName(option.name)).toBe(option.icon)
    }
  })

  it('returns null for unknown or missing names', () => {
    expect(projectIconByName('not-an-icon')).toBeNull()
    expect(projectIconByName(null)).toBeNull()
    expect(projectIconByName(undefined)).toBeNull()
  })
})

describe('lightenColor', () => {
  it('mixes a color toward white', () => {
    expect(lightenColor('#000000', 0.5)).toBe('#808080')
    expect(lightenColor('#ffffff', 0.5)).toBe('#ffffff')
  })

  it('returns malformed input unchanged', () => {
    expect(lightenColor('#fff')).toBe('#fff')
  })

  it('produces valid hex for every color option', () => {
    for (const color of projectColorOptions) {
      expect(lightenColor(color)).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
