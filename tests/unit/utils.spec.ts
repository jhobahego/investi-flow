import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('combines multiple class strings into one', () => {
    // Arrange
    const base = 'px-2 py-1'
    const extra = 'text-sm'

    // Act
    const result = cn(base, extra)

    // Assert
    expect(result).toContain('px-2')
    expect(result).toContain('py-1')
    expect(result).toContain('text-sm')
  })

  it('resolves conflicting tailwind utilities keeping the last one', () => {
    // Arrange
    const first = 'px-2'
    const second = 'px-4'

    // Act
    const result = cn(first, second)

    // Assert
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })

  it('ignores falsy and empty values', () => {
    // Arrange
    const present = 'block'
    const missing = 'hidden'

    // Act
    const result = cn(present, false, null, undefined, '', missing && false)

    // Assert
    expect(result).toBe('block')
  })

  it('supports conditional object syntax', () => {
    // Arrange
    const isActive = true
    const isHidden = false

    // Act
    const result = cn({ active: isActive, hidden: isHidden })

    // Assert
    expect(result).toContain('active')
    expect(result).not.toContain('hidden')
  })

  it('supports arrays of classes', () => {
    // Arrange
    const classes = ['flex', 'items-center']

    // Act
    const result = cn(classes, 'gap-2')

    // Assert
    expect(result).toContain('flex')
    expect(result).toContain('items-center')
    expect(result).toContain('gap-2')
  })

  it('returns an empty string when there is nothing to merge', () => {
    // Arrange
    const noClasses: Array<string | false | null | undefined> = [false, null, undefined, '']

    // Act
    const result = cn(...noClasses)

    // Assert
    expect(result).toBe('')
  })
})
