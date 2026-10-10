import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProjectBoard from '@/views/ProjectBoard.vue'
import { ProjectStatus } from '@/types'

const { projectsStoreMock, toastMocks } = vi.hoisted(() => ({
  projectsStoreMock: {
    loading: false,
    error: null as string | null,
    currentProject: null as Record<string, unknown> | null,
    fetchProjectWithPhases: vi.fn(),
    updateProject: vi.fn(),
    invalidateProjectCache: vi.fn(),
  },
  toastMocks: {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/projects', () => ({
  useProjectsStore: () => projectsStoreMock,
}))

vi.mock('@/stores/phases', () => ({
  usePhasesStore: () => ({
    error: null,
    loading: false,
    clearError: vi.fn(),
    createPhase: vi.fn(),
    updatePhase: vi.fn(),
    deletePhase: vi.fn(),
  }),
}))

vi.mock('@/stores/tasks', () => ({
  useTasksStore: () => ({
    tasks: [],
    loading: false,
    error: null,
    getTasksByPhase: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    moveTaskToPhase: vi.fn(),
  }),
}))

vi.mock('@/stores/attachments', () => ({
  useAttachmentsStore: () => ({
    loading: false,
    getDocument: vi.fn().mockResolvedValue(null),
    getCachedDocument: vi.fn().mockReturnValue(null),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => toastMocks,
}))

function makeCurrentProject() {
  return {
    id: 1,
    name: 'Alpha Project',
    description: 'Study on alpha particles',
    research_type: null,
    institution: null,
    research_group: null,
    category: null,
    status: ProjectStatus.PLANNING,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    phases: [],
  }
}

async function mountBoard() {
  const wrapper = mount(ProjectBoard, {
    global: {
      stubs: {
        AppNavbar: { template: '<nav></nav>' },
        PhaseColumn: { template: '<div></div>' },
        AttachmentUpload: { template: '<div></div>' },
        SkeletonLoader: { template: '<div></div>' },
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('ProjectBoard inline rename', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    projectsStoreMock.loading = false
    projectsStoreMock.error = null
    projectsStoreMock.currentProject = makeCurrentProject()
    projectsStoreMock.fetchProjectWithPhases.mockResolvedValue(projectsStoreMock.currentProject)
    projectsStoreMock.updateProject.mockImplementation(async (_id: number, payload: { name: string }) => ({
      ...makeCurrentProject(),
      name: payload.name,
    }))
  })

  it('renders the project name as a clickable h1 with a rename hint', async () => {
    // Arrange & Act
    const wrapper = await mountBoard()

    // Assert
    const title = wrapper.find('h1')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Alpha Project')
    expect(title.attributes('title')).toMatch(/renombrar|rename/i)
  })

  it('clicking the title swaps it for an autofocused input prefilled with the current name', async () => {
    // Arrange
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus')
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select')
    const wrapper = await mountBoard()

    // Act
    await wrapper.find('h1').trigger('click')

    // Assert
    const input = wrapper.find('input[aria-label="Nombre del proyecto"]')
    expect(input.exists()).toBe(true)
    expect(wrapper.find('h1').exists()).toBe(false)
    expect((input.element as HTMLInputElement).value).toBe('Alpha Project')
    await flushPromises()
    expect(focusSpy).toHaveBeenCalled()
    expect(selectSpy).toHaveBeenCalled()
  })

  it('Enter with a valid new name calls updateProject with the trimmed name and toasts success', async () => {
    // Arrange
    const wrapper = await mountBoard()
    await wrapper.find('h1').trigger('click')
    const input = wrapper.find('input[aria-label="Nombre del proyecto"]')

    // Act
    await input.setValue('  New Project Name  ')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    // Assert
    expect(projectsStoreMock.updateProject).toHaveBeenCalledTimes(1)
    expect(projectsStoreMock.updateProject).toHaveBeenCalledWith(1, { name: 'New Project Name' })
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('Proyecto renombrado exitosamente')
  })

  it('Esc cancels editing without calling the API and restores the old name', async () => {
    // Arrange
    const wrapper = await mountBoard()
    await wrapper.find('h1').trigger('click')
    const input = wrapper.find('input[aria-label="Nombre del proyecto"]')

    // Act
    await input.setValue('Discarded Name')
    await input.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    // Assert
    expect(projectsStoreMock.updateProject).not.toHaveBeenCalled()
    expect(toastMocks.showSuccess).not.toHaveBeenCalled()
    const title = wrapper.find('h1')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Alpha Project')
  })

  it('rejects a blank name with an error toast and no request', async () => {
    // Arrange
    const wrapper = await mountBoard()
    await wrapper.find('h1').trigger('click')
    const input = wrapper.find('input[aria-label="Nombre del proyecto"]')

    // Act
    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    // Assert
    expect(projectsStoreMock.updateProject).not.toHaveBeenCalled()
    expect(toastMocks.showError).toHaveBeenCalledWith('El nombre del proyecto no puede estar vacío')
    expect(wrapper.find('h1').exists()).toBe(true)
  })

  it('blur with a valid name also saves via updateProject', async () => {
    // Arrange
    const wrapper = await mountBoard()
    await wrapper.find('h1').trigger('click')
    const input = wrapper.find('input[aria-label="Nombre del proyecto"]')

    // Act
    await input.setValue('Blurred Name')
    await input.trigger('blur')
    await flushPromises()

    // Assert
    expect(projectsStoreMock.updateProject).toHaveBeenCalledWith(1, { name: 'Blurred Name' })
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('Proyecto renombrado exitosamente')
  })
})
