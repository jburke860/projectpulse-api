import { describe, expect, it } from 'vitest'
import { getMutationErrorMessage } from './errors'

describe('getMutationErrorMessage', () => {
  it('returns null for no error', () => {
    expect(getMutationErrorMessage(null)).toBeNull()
    expect(getMutationErrorMessage(undefined)).toBeNull()
  })

  it('joins API validation errors', () => {
    const error = { response: { data: { errors: ['Name is required.', 'Status is invalid.'] } } }
    expect(getMutationErrorMessage(error)).toBe('Name is required. Status is invalid.')
  })

  it('falls back to the API message', () => {
    const error = { response: { data: { message: 'Rate limit exceeded' } } }
    expect(getMutationErrorMessage(error)).toBe('Rate limit exceeded')
  })

  it('falls back to the Error message', () => {
    expect(getMutationErrorMessage(new Error('Network Error'))).toBe('Network Error')
  })

  it('returns a generic message for unknown shapes', () => {
    expect(getMutationErrorMessage({})).toBe('Something went wrong.')
  })
})
