import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ArchivedProjectsView from '@/views/ArchivedProjectsView.vue'
import { ProjectStatus } from '@/types'

const { projectsStoreMock, toastMocks } = vi.hoisted(() => ({
  projectsStoreMock: {
    archivedProjects: [] as unknown[],
    loading: false,
    error: null as string | null,
    fetchArchived: vi.fn(),
    restore: vi.fn(),
    hardDelete: vi.fn(),
  },
  toastMocks: {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  },
}))

vi.mock('@/stores/projects', () => ({
  useProjectsStore: () => projectsStoreMock,
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => toastMocks,
}))

function makeArchived(id: number, name: string) {
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
    deleted_at: '2024-03-01T00:00:00.000Z',
  }
}

function mountView() {
  return mount(ArchivedProjectsView, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        AppNavbar: { template: '<div />' },
      },
    },
  })
}

describe('ArchivedProjectsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    projectsStoreMock.archivedProjects = [makeArchived(10, 'Archived Alpha')]
    projectsStoreMock.loading = false
    projectsStoreMock.error = null
    projectsStoreMock.fetchArchived.mockResolvedValue(undefined)
    projectsStoreMock.restore.mockResolvedValue(undefined)
    projectsStoreMock.hardDelete.mockResolvedValue(undefined)
    document.body.innerHTML = ''
  })

  it('fetches archived projects on mount and renders the title', async () => {
    // Arrange & Act
    const wrapper = mountView()
    await flushPromises()

    // Assert
    expect(projectsStoreMock.fetchArchived).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Proyectos Archivados')
    expect(wrapper.text()).toContain('Archived Alpha')
  })

  it('shows always-visible Restaurar and Eliminar Definitivamente buttons', async () => {
    // Arrange & Act
    const wrapper = mountView()
    await flushPromises()

    // Assert: not hover-only, rendered as plain buttons in the card
    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons.some((t) => t.includes('Restaurar'))).toBe(true)
    expect(buttons.some((t) => t.includes('Eliminar Definitivamente'))).toBe(true)
  })

  it('restores the project with a success toast on Restaurar', async () => {
    // Arrange
    const wrapper = mountView()
    await flushPromises()
    const restoreButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Restaurar'))!

    // Act
    await restoreButton.trigger('click')
    await flushPromises()

    // Assert
    expect(projectsStoreMock.restore).toHaveBeenCalledWith(10)
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('Proyecto restaurado')
  })

  it('asks for confirmation and hard-deletes on Eliminar Definitivamente', async () => {
    // Arrange
    const wrapper = mountView()
    await flushPromises()
    const hardDeleteButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Eliminar Definitivamente'))!

    // Act: open the confirmation dialog
    await hardDeleteButton.trigger('click')
    await flushPromises()

    // Assert: ConfirmDialog is used for the permanent delete
    expect(wrapper.text()).toContain('Eliminar Definitivamente')
    expect(projectsStoreMock.hardDelete).not.toHaveBeenCalled()

    // Act: type the project name and confirm
    const input = wrapper.find('input')
    await input.setValue('Archived Alpha')
    const confirmButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Eliminar Definitivamente') && b.element !== hardDeleteButton.element) ?? hardDeleteButton
    await confirmButton.trigger('click')
    await flushPromises()

    // Assert
    expect(projectsStoreMock.hardDelete).toHaveBeenCalledWith(10)
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('Proyecto eliminado definitivamente')
  })

  it('shows an empty state when there are no archived projects', async () => {
    // Arrange
    projectsStoreMock.archivedProjects = []

    // Act
    const wrapper = mountView()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('No tienes proyectos archivados')
  })
})
