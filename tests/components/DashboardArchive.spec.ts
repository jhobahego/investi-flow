import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DashboardPage from '@/views/DashboardPage.vue'
import { ProjectStatus } from '@/types'

const { pushMock, projectsStoreMock, toastMocks } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  projectsStoreMock: {
    projects: [] as unknown[],
    loading: false,
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    archive: vi.fn(),
    deleteProject: vi.fn(),
    setCurrentProjectId: vi.fn(),
  },
  toastMocks: {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/stores/projects', () => ({
  useProjectsStore: () => projectsStoreMock,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { full_name: 'Test User' } }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => toastMocks,
}))

function makeProject(id: number, name: string) {
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

async function mountDashboard() {
  const wrapper = mount(DashboardPage, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('DashboardPage archiving', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    projectsStoreMock.projects = [makeProject(1, 'Alpha')]
    projectsStoreMock.loading = false
    projectsStoreMock.fetchProjects.mockResolvedValue(undefined)
    projectsStoreMock.archive.mockResolvedValue(undefined)
    projectsStoreMock.deleteProject.mockResolvedValue(undefined)
  })

  it('archives instead of hard-deleting and toasts "Proyecto archivado"', async () => {
    // Arrange
    const wrapper = await mountDashboard()
    await wrapper.find('button[title="Eliminar proyecto"]').trigger('click')
    await flushPromises()

    // Act: type the project name and confirm
    await wrapper.find('input').setValue('Alpha')
    const confirmButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Archivar') || b.text().includes('Eliminar'))!
    await confirmButton.trigger('click')
    await flushPromises()

    // Assert: archive flow with the archiving toast
    expect(projectsStoreMock.archive).toHaveBeenCalledWith(1)
    expect(projectsStoreMock.deleteProject).not.toHaveBeenCalled()
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('Proyecto archivado')
  })

  it('links to the archived projects view', async () => {
    // Arrange & Act
    const wrapper = await mountDashboard()

    // Assert
    expect(wrapper.text()).toContain('Proyectos Archivados')
  })
})
