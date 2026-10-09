import { afterEach, describe, expect, it } from 'vitest'

describe('smoke', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('provides a working jsdom document', () => {
    // Arrange
    const element = document.createElement('p')
    element.textContent = 'hello'

    // Act
    document.body.appendChild(element)

    // Assert
    expect(document.querySelector('p')?.textContent).toBe('hello')
  })
})
