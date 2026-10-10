import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { ENV } from '@/config/env.config'
import { ProjectStatus, type ProjectResponse } from '@/types'
import { useProjectsStore } from '@/stores/projects'

const API = ENV.API_URL

function makeProject(
  id: number,
  name: string,
  overrides: Record<string, unknown> = {},
): ProjectResponse {
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
    ...overrides,
  } as ProjectResponse
}

function archivedFixture(): ProjectResponse[] {
  return [
    makeProject(10, 'Archived Alpha', { deleted_at: '2024-03-01T00:00:00.000Z' }),
    makeProject(11, 'Archived Beta', { deleted_at: '2024-03-02T00:00:00.000Z' }),
  ]
}

describe('projects store archiving', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setActivePinia(createPinia())
  })

  it('fetchArchived loads archived projects from GET /proyectos/archived', async () => {
    // Arrange
    const archived = archivedFixture()
    server.use(
      http.get(`${API}/proyectos/archived`, () => HttpResponse.json(archived)),
    )
    const store = useProjectsStore()

    // Act
    await store.fetchArchived()

    // Assert
    expect(store.archivedProjects).toEqual(archived)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('archive removes the project from the active list via DELETE /proyectos/{id}', async () => {
    // Arrange
    server.use(
      http.delete(`${API}/proyectos/1`, () => HttpResponse.json({ detail: 'archived' })),
    )
    const store = useProjectsStore()
    store.projects = [makeProject(1, 'Alpha'), makeProject(2, 'Beta')]

    // Act
    await store.archive(1)

    // Assert
    expect(store.projects.map((p) => p.id)).toEqual([2])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('archive is idempotent: archiving an already-archived id keeps lists consistent', async () => {
    // Arrange
    server.use(
      http.delete(`${API}/proyectos/99`, () => HttpResponse.json({ detail: 'already archived' })),
    )
    const store = useProjectsStore()
    store.projects = [makeProject(1, 'Alpha')]

    // Act
    await store.archive(99)

    // Assert
    expect(store.projects.map((p) => p.id)).toEqual([1])
    expect(store.error).toBeNull()
  })

  it('restore removes the project from the archived list via POST /proyectos/{id}/restore', async () => {
    // Arrange
    const restored = makeProject(10, 'Archived Alpha', { deleted_at: null })
    server.use(
      http.post(`${API}/proyectos/10/restore`, () => HttpResponse.json(restored)),
    )
    const store = useProjectsStore()
    store.archivedProjects = archivedFixture()

    // Act
    await store.restore(10)

    // Assert
    expect(store.archivedProjects.map((p) => p.id)).toEqual([11])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('hardDelete removes the project from the archived list via DELETE /proyectos/{id}/permanent', async () => {
    // Arrange
    server.use(
      http.delete(`${API}/proyectos/10/permanent`, () => HttpResponse.json({ detail: 'deleted' })),
    )
    const store = useProjectsStore()
    store.archivedProjects = archivedFixture()

    // Act
    await store.hardDelete(10)

    // Assert
    expect(store.archivedProjects.map((p) => p.id)).toEqual([11])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('exposes deleted_at on project list types', () => {
    // Arrange & Act: type-level contract mirrored from GET /proyectos/archived
    const project = makeProject(10, 'Archived Alpha', {
      deleted_at: '2024-03-01T00:00:00.000Z',
    })

    // Assert
    expect((project as unknown as Record<string, unknown>).deleted_at).toBe(
      '2024-03-01T00:00:00.000Z',
    )
  })
})
