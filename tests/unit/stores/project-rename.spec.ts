import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { renameProjectErrorHandler, renameProjectHandler } from '../../mocks/handlers'
import { ENV } from '@/config/env.config'
import { ProjectStatus, type ProjectResponse, type ProjectWithPhases } from '@/types'
import { useProjectsStore } from '@/stores/projects'

const API = ENV.API_URL

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

function makeProjectWithPhases(id: number, name: string): ProjectWithPhases {
  return { ...makeProject(id, name), phases: [] }
}

describe('projects store inline rename', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setActivePinia(createPinia())
  })

  it('sends PUT /proyectos/{id} with the new name and returns the updated project', async () => {
    // Arrange
    server.use(renameProjectHandler)
    const store = useProjectsStore()

    // Act
    const updated = await store.updateProject(1, { name: 'Renamed Project' })

    // Assert
    expect(updated.name).toBe('Renamed Project')
    expect(updated.id).toBe(1)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('syncs currentProject when renaming the open project', async () => {
    // Arrange
    server.use(renameProjectHandler)
    const store = useProjectsStore()
    store.currentProject = makeProjectWithPhases(1, 'Old Name')

    // Act
    await store.updateProject(1, { name: 'New Name' })

    // Assert
    expect(store.currentProject?.name).toBe('New Name')
  })

  it('syncs the renamed project in the list and leaves the rest untouched', async () => {
    // Arrange
    server.use(renameProjectHandler)
    const store = useProjectsStore()
    store.projects = [makeProject(1, 'Old Name'), makeProject(2, 'Other')]

    // Act
    await store.updateProject(1, { name: 'New Name' })

    // Assert
    expect(store.projects.map((p) => p.name)).toEqual(['New Name', 'Other'])
  })

  it('trims the name before sending it to the API', async () => {
    // Arrange
    let sentBody: unknown
    server.use(
      http.put(`${API}/proyectos/1`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(makeProject(1, 'Trimmed'))
      }),
    )
    const store = useProjectsStore()

    // Act
    await store.updateProject(1, { name: '  Trimmed  ' })

    // Assert
    expect(sentBody).toEqual({ name: 'Trimmed' })
  })

  it('keeps the previous name and surfaces the backend detail on failure', async () => {
    // Arrange
    server.use(renameProjectErrorHandler)
    const store = useProjectsStore()
    store.currentProject = makeProjectWithPhases(1, 'Old Name')
    store.projects = [makeProject(1, 'Old Name')]

    // Act
    await expect(store.updateProject(1, { name: 'New Name' })).rejects.toThrow()

    // Assert
    expect(store.currentProject?.name).toBe('Old Name')
    expect(store.projects[0].name).toBe('Old Name')
    expect(store.error).toBe('Error interno del servidor. Por favor, intenta nuevamente.')
    expect(store.loading).toBe(false)
  })
})
