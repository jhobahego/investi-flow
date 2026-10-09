import { describe, expect, it } from 'vitest'
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatDateToISO,
  formatISOToDate,
} from '@/lib/dateUtils'

describe('formatDateToISO', () => {
  it('converts a plain YYYY-MM-DD date to a UTC midnight ISO datetime', () => {
    // Arrange
    const input = '2024-03-15'

    // Act
    const result = formatDateToISO(input)

    // Assert
    expect(result).toBe('2024-03-15T00:00:00.000Z')
  })

  it('returns null for a null input', () => {
    // Arrange
    const input = null

    // Act
    const result = formatDateToISO(input)

    // Assert
    expect(result).toBeNull()
  })

  it('returns null for an empty string', () => {
    // Arrange
    const input = ''

    // Act
    const result = formatDateToISO(input)

    // Assert
    expect(result).toBeNull()
  })

  it('returns an already-complete datetime unchanged', () => {
    // Arrange
    const input = '2024-03-15T14:30:00.000Z'

    // Act
    const result = formatDateToISO(input)

    // Assert
    expect(result).toBe(input)
  })

  it('converts leap day to UTC midnight ISO datetime', () => {
    // Arrange
    const input = '2024-02-29'

    // Act
    const result = formatDateToISO(input)

    // Assert
    expect(result).toBe('2024-02-29T00:00:00.000Z')
  })

  it('converts a year-end date to UTC midnight ISO datetime', () => {
    // Arrange
    const input = '2024-12-31'

    // Act
    const result = formatDateToISO(input)

    // Assert
    expect(result).toBe('2024-12-31T00:00:00.000Z')
  })
})

describe('formatISOToDate', () => {
  it('extracts the YYYY-MM-DD part from an ISO datetime', () => {
    // Arrange
    const input = '2024-03-15T14:30:00.000Z'

    // Act
    const result = formatISOToDate(input)

    // Assert
    expect(result).toBe('2024-03-15')
  })

  it('returns null for a null input', () => {
    // Arrange
    const input = null

    // Act
    const result = formatISOToDate(input)

    // Assert
    expect(result).toBeNull()
  })

  it('returns null for an empty string', () => {
    // Arrange
    const input = ''

    // Act
    const result = formatISOToDate(input)

    // Assert
    expect(result).toBeNull()
  })

  it('returns a plain date without time part unchanged', () => {
    // Arrange
    const input = '2024-03-15'

    // Act
    const result = formatISOToDate(input)

    // Assert
    expect(result).toBe('2024-03-15')
  })

  it('extracts the date part as-is from a datetime with timezone offset', () => {
    // Arrange: string split, no timezone conversion is applied
    const input = '2024-06-15T23:00:00+02:00'

    // Act
    const result = formatISOToDate(input)

    // Assert
    expect(result).toBe('2024-06-15')
  })
})

describe('formatDateForDisplay', () => {
  it('returns null for a null input', () => {
    // Arrange
    const input = null

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toBeNull()
  })

  it('returns null for an empty string', () => {
    // Arrange
    const input = ''

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toBeNull()
  })

  it('formats a date in the default Spanish locale', () => {
    // Arrange: midday UTC keeps the calendar day stable across UTC-12..+11
    const input = '2024-06-15T12:00:00.000Z'

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toBe('15 de junio de 2024')
  })

  it('formats leap day in the default Spanish locale', () => {
    // Arrange
    const input = '2024-02-29T12:00:00.000Z'

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toBe('29 de febrero de 2024')
  })

  it('formats a year-end date in the default Spanish locale', () => {
    // Arrange
    const input = '2024-12-31T12:00:00.000Z'

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toBe('31 de diciembre de 2024')
  })

  it('handles a midnight UTC datetime without crashing', () => {
    // Arrange: the displayed calendar day depends on the runner timezone
    // (e.g. America/Bogota shows the previous day), so only assert shape.
    const input = '2024-01-01T00:00:00.000Z'

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toEqual(expect.stringMatching(/\d{4}/))
  })

  it('formats the same date differently for another locale', () => {
    // Arrange
    const input = '2024-06-15T12:00:00.000Z'

    // Act
    const spanish = formatDateForDisplay(input, 'es-ES')
    const english = formatDateForDisplay(input, 'en-US')

    // Assert
    expect(english).toContain('2024')
    expect(english).toContain('June')
    expect(english).not.toBe(spanish)
  })

  it('returns "Invalid Date" for an unparseable string', () => {
    // Arrange: `new Date` never throws; `toLocaleDateString` yields 'Invalid Date'
    const input = 'not-a-date'

    // Act
    const result = formatDateForDisplay(input)

    // Assert
    expect(result).toBe('Invalid Date')
  })
})

describe('formatDateTimeForDisplay', () => {
  it('returns null for a null input', () => {
    // Arrange
    const input = null

    // Act
    const result = formatDateTimeForDisplay(input)

    // Assert
    expect(result).toBeNull()
  })

  it('returns null for an empty string', () => {
    // Arrange
    const input = ''

    // Act
    const result = formatDateTimeForDisplay(input)

    // Assert
    expect(result).toBeNull()
  })

  it('includes both date and time parts', () => {
    // Arrange
    const input = '2024-06-15T12:30:00.000Z'

    // Act
    const result = formatDateTimeForDisplay(input)

    // Assert
    expect(result).toContain('2024')
    expect(result).toEqual(expect.stringMatching(/\d{1,2}:\d{2}/))
  })

  it('formats the same datetime differently for another locale', () => {
    // Arrange
    const input = '2024-06-15T12:30:00.000Z'

    // Act
    const spanish = formatDateTimeForDisplay(input, 'es-ES')
    const english = formatDateTimeForDisplay(input, 'en-US')

    // Assert
    expect(spanish).toContain('2024')
    expect(english).toContain('2024')
    expect(english).not.toBe(spanish)
  })

  it('handles a midnight UTC datetime without crashing', () => {
    // Arrange: the displayed calendar day depends on the runner timezone
    const input = '2024-01-01T00:00:00.000Z'

    // Act
    const result = formatDateTimeForDisplay(input)

    // Assert
    expect(result).toEqual(expect.stringMatching(/\d{4}/))
    expect(result).toEqual(expect.stringMatching(/\d{1,2}:\d{2}/))
  })

  it('returns "Invalid Date" for an unparseable string', () => {
    // Arrange: `new Date` never throws; `toLocaleString` yields 'Invalid Date'
    const input = 'not-a-date'

    // Act
    const result = formatDateTimeForDisplay(input)

    // Assert
    expect(result).toBe('Invalid Date')
  })
})
