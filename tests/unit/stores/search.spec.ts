import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ProjectStatus, type ProjectResponse } from '@/types'
import apiClient from '@/api/client'
import { useSearchStore } from '@/stores/search'

const { apiMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, default: apiMock }
})

const mockedGet = vi.mocked(apiClient.get)

function makeProject(id: number, name: string): ProjectResponse {
  return {
    id,
    name,
    description: `Description ${id}`,
    research_type: null,
    institution: null,
    research_group: null,
    category: null,
    status: ProjectStatus.PLANNING,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }
}

describe('search store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setActivePinia(createPinia())
  })

  it('has the expected initial state', () => {
    // Arrange & Act
    const store = useSearchStore()

    // Assert
    expect(store.results).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastQuery).toBe('')
  })

  it('searches projects successfully and stores results', async () => {
    // Arrange
    const projects = [makeProject(1, 'Alpha'), makeProject(2, 'Beta')]
    mockedGet.mockResolvedValueOnce({ data: projects })
    const store = useSearchStore()

    // Act
    await store.searchProjects('alpha')

    // Assert
    expect(mockedGet).toHaveBeenCalledTimes(1)
    expect(mockedGet).toHaveBeenCalledWith('/proyectos/search', {
      params: { query: 'alpha' },
    })
    expect(store.results).toEqual(projects)
    expect(store.lastQuery).toBe('alpha')
    expect(store.error).toBeNull()
    expect(store.isLoading).toBe(false)
  })

  it('trims the query before sending it to the API', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: [] })
    const store = useSearchStore()

    // Act
    await store.searchProjects('  inteligencia  ')

    // Assert
    expect(mockedGet).toHaveBeenCalledWith('/proyectos/search', {
      params: { query: 'inteligencia' },
    })
    expect(store.lastQuery).toBe('  inteligencia  ')
  })

  it('stores an empty list when the API returns no results', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: [] })
    const store = useSearchStore()

    // Act
    await store.searchProjects('nothing-matches')

    // Assert
    expect(store.results).toEqual([])
    expect(store.error).toBeNull()
    expect(store.isLoading).toBe(false)
  })

  it('sets the API detail message and clears results on error', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce({
      response: { data: { detail: 'Search backend unavailable' } },
    })
    const store = useSearchStore()

    // Act
    await store.searchProjects('alpha')

    // Assert
    expect(store.error).toBe('Search backend unavailable')
    expect(store.results).toEqual([])
    expect(store.isLoading).toBe(false)
  })

  it('sets a fallback message when the error has no detail', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce({})
    const store = useSearchStore()

    // Act
    await store.searchProjects('alpha')

    // Assert
    expect(store.error).toBe('Error al realizar la búsqueda')
    expect(store.results).toEqual([])
    expect(store.isLoading).toBe(false)
  })

  it('sets isLoading while the request is in flight', async () => {
    // Arrange
    let resolveRequest!: (value: { data: ProjectResponse[] }) => void
    mockedGet.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    const store = useSearchStore()

    // Act
    const pending = store.searchProjects('alpha')

    // Assert (pending)
    expect(store.isLoading).toBe(true)

    // Act (resolve)
    resolveRequest({ data: [makeProject(1, 'Alpha')] })
    await pending

    // Assert (settled)
    expect(store.isLoading).toBe(false)
    expect(store.results).toHaveLength(1)
  })

  it('clears results without calling the API for a blank query', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: [makeProject(1, 'Alpha')] })
    const store = useSearchStore()
    await store.searchProjects('alpha')
    expect(store.results).toHaveLength(1)
    mockedGet.mockClear()

    // Act
    await store.searchProjects('   ')

    // Assert
    expect(mockedGet).not.toHaveBeenCalled()
    expect(store.results).toEqual([])
    expect(store.lastQuery).toBe('')
    expect(store.error).toBeNull()
  })

  it('clearResults resets results, lastQuery and error', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce({
      response: { data: { detail: 'boom' } },
    })
    const store = useSearchStore()
    await store.searchProjects('alpha')
    expect(store.error).toBe('boom')

    // Act
    store.clearResults()

    // Assert
    expect(store.results).toEqual([])
    expect(store.lastQuery).toBe('')
    expect(store.error).toBeNull()
  })

  it('clearError resets the error message', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce({})
    const store = useSearchStore()
    await store.searchProjects('alpha')
    expect(store.error).not.toBeNull()

    // Act
    store.clearError()

    // Assert
    expect(store.error).toBeNull()
  })
})
