import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formats a date-only ISO string as dd/mm/yyyy', () => {
    expect(formatDate('2026-10-19')).toBe('19/10/2026')
  })

  it('does not roll the day back for date-only values in negative offsets', () => {
    // Parsing as UTC midnight would show 31/12/2025 in UTC-3; we must keep 01/01.
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
  })

  it('returns a dash for empty, null or undefined input', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('returns the original string when it cannot be parsed', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})
