import { describe, expect, it, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/ui/SearchBar.vue'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function mountSearchBar(props: { initialValue?: string; placeholder?: string } = {}) {
  return mount(SearchBar, { props })
}

describe('SearchBar', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders with the default placeholder', () => {
    // Arrange & Act
    const wrapper = mountSearchBar()

    // Assert
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Buscar proyectos...')
  })

  it('renders with a custom placeholder', () => {
    // Arrange & Act
    const wrapper = mountSearchBar({ placeholder: 'Search tasks...' })

    // Assert
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Search tasks...')
  })

  it('initializes the input with the initialValue prop', async () => {
    // Arrange & Act
    const wrapper = mountSearchBar({ initialValue: 'migración' })
    await nextTick()

    // Assert
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('migración')
  })

  it('navigates to SearchResults with the trimmed query on Enter', async () => {
    // Arrange
    const wrapper = mountSearchBar()
    const input = wrapper.find('input')

    // Act
    await input.setValue('  inteligencia artificial  ')
    await input.trigger('keyup.enter')

    // Assert
    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith({
      name: 'SearchResults',
      query: { q: 'inteligencia artificial' },
    })
  })

  it('does not navigate on Enter when the query is empty or blank', async () => {
    // Arrange
    const wrapper = mountSearchBar()
    const input = wrapper.find('input')

    // Act
    await input.trigger('keyup.enter')
    await input.setValue('   ')
    await input.trigger('keyup.enter')

    // Assert
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('hides the clear button when the query is empty', () => {
    // Arrange & Act
    const wrapper = mountSearchBar()

    // Assert
    expect(wrapper.find('button[aria-label="Limpiar búsqueda"]').exists()).toBe(false)
  })

  it('shows the clear button after typing and clears the query on click', async () => {
    // Arrange
    const wrapper = mountSearchBar()
    const input = wrapper.find('input')
    await input.setValue('cohetes')
    expect(wrapper.find('button[aria-label="Limpiar búsqueda"]').exists()).toBe(true)

    // Act
    await wrapper.find('button[aria-label="Limpiar búsqueda"]').trigger('click')

    // Assert
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('button[aria-label="Limpiar búsqueda"]').exists()).toBe(false)
    expect(pushMock).not.toHaveBeenCalled()
  })
})
