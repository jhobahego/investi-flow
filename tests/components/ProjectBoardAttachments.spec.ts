import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import ProjectBoard from '@/views/ProjectBoard.vue'
import PhaseColumn from '@/components/ui/PhaseColumn.vue'
import { useAttachmentsStore } from '@/stores/attachments'
import {
  FileType,
  ProjectStatus,
  TaskStatus,
  type AttachmentResponse,
  type PhaseResponse,
  type TaskResponse,
} from '@/types'

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

vi.mock('@/composables/useToast', () => ({
  useToast: () => toastMocks,
}))

const AttachmentUploadStub = defineComponent({
  name: 'AttachmentUpload',
  props: {
    entityType: { type: String, required: true },
    entityId: { type: Number, required: true },
    currentAttachment: { type: Object as () => AttachmentResponse | null | undefined, default: null },
  },
  emits: ['attachment-uploaded', 'attachment-updated'],
  template:
    '<div data-testid="attachment-upload-stub" :data-entity-type="entityType" :data-entity-id="entityId" :data-status="currentAttachment?.indexing_status ?? \'none\'" />',
})

const PhaseColumnStub = defineComponent({
  name: 'PhaseColumn',
  props: {
    phase: { type: Object, required: true },
    tasks: { type: Array, required: true },
  },
  emits: ['task-click'],
  template: '<div data-testid="phase-column-stub" />',
})

const ModalStub = defineComponent({
  name: 'Modal',
  props: {
    isOpen: { type: Boolean, required: true },
    title: { type: String, default: '' },
    size: { type: String, default: 'md' },
  },
  template: '<div v-if="isOpen"><slot /><slot name="footer" /></div>',
})

function makePhase(overrides: Partial<PhaseResponse> = {}): PhaseResponse {
  return {
    id: 9,
    name: 'Fase 1',
    position: 0,
    color: '#3b82f6',
    project_id: 1,
    ...overrides,
  }
}

function makeTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 42,
    title: 'Revisar literatura',
    description: 'Descripción',
    position: 0,
    status: TaskStatus.PENDING,
    start_date: null,
    end_date: null,
    completed: false,
    phase_id: 9,
    created_at: '2026-11-18T10:00:00Z',
    updated_at: '2026-11-18T10:00:00Z',
    ...overrides,
  }
}

function makeAttachment(overrides: Partial<AttachmentResponse> = {}): AttachmentResponse {
  return {
    id: 50,
    file_name: 'tesis.docx',
    file_type: FileType.DOCX,
    file_size: 2048,
    file_path: 'uploads/tesis.docx',
    project_id: 1,
    phase_id: null,
    task_id: null,
    indexing_status: 'pending',
    created_at: '2026-11-18T10:00:00Z',
    updated_at: '2026-11-18T10:00:00Z',
    ...overrides,
  }
}

describe('ProjectBoard & PhaseColumn attachment propagation', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    projectsStoreMock.loading = false
    projectsStoreMock.error = null
    projectsStoreMock.currentProject = {
      id: 1,
      name: 'Alpha Project',
      description: 'Study on alpha particles',
      research_type: null,
      institution: null,
      research_group: null,
      category: null,
      status: ProjectStatus.PLANNING,
      created_at: '2026-11-18T00:00:00Z',
      updated_at: '2026-11-18T00:00:00Z',
      phases: [makePhase()],
    }
    projectsStoreMock.fetchProjectWithPhases.mockResolvedValue(projectsStoreMock.currentProject)
  })

  it('updates projectDocument and attachments store cache on project attachment upload and update', async () => {
    const attachmentsStore = useAttachmentsStore(pinia)
    vi.spyOn(attachmentsStore, 'getDocument').mockResolvedValue(null)
    const setCacheSpy = vi.spyOn(attachmentsStore, 'setCachedDocument')

    const wrapper = mount(ProjectBoard, {
      global: {
        plugins: [pinia],
        stubs: {
          AppNavbar: { template: '<nav></nav>' },
          PhaseColumn: PhaseColumnStub,
          AttachmentUpload: AttachmentUploadStub,
          SkeletonLoader: { template: '<div></div>' },
          Modal: ModalStub,
        },
      },
    })
    await flushPromises()

    await wrapper.find('button[title="Adjuntar documento principal"]').trigger('click')
    await flushPromises()

    const uploadStub = wrapper.findComponent(AttachmentUploadStub)
    expect(uploadStub.exists()).toBe(true)

    const pending = makeAttachment({ id: 50, project_id: 1, indexing_status: 'pending' })
    const indexed = makeAttachment({ id: 50, project_id: 1, indexing_status: 'indexed' })

    uploadStub.vm.$emit('attachment-uploaded', pending)
    await flushPromises()

    expect(setCacheSpy).toHaveBeenCalledWith('project', 1, pending)
    expect(uploadStub.attributes('data-status')).toBe('pending')

    uploadStub.vm.$emit('attachment-updated', indexed)
    await flushPromises()

    expect(setCacheSpy).toHaveBeenCalledWith('project', 1, indexed)
    expect(uploadStub.attributes('data-status')).toBe('indexed')
  })

  it('updates task attachments store cache on task attachment upload and update', async () => {
    const attachmentsStore = useAttachmentsStore(pinia)
    vi.spyOn(attachmentsStore, 'getDocument').mockResolvedValue(null)
    const setCacheSpy = vi.spyOn(attachmentsStore, 'setCachedDocument')

    const wrapper = mount(ProjectBoard, {
      global: {
        plugins: [pinia],
        stubs: {
          AppNavbar: { template: '<nav></nav>' },
          PhaseColumn: PhaseColumnStub,
          AttachmentUpload: AttachmentUploadStub,
          SkeletonLoader: { template: '<div></div>' },
          Modal: ModalStub,
        },
      },
    })
    await flushPromises()

    wrapper.findComponent(PhaseColumnStub).vm.$emit('task-click', makeTask({ id: 42 }))
    await flushPromises()

    const taskUploadStub = wrapper
      .findAllComponents(AttachmentUploadStub)
      .find((c) => c.props('entityType') === 'task')
    expect(taskUploadStub).toBeDefined()

    const pending = makeAttachment({
      id: 77,
      project_id: null,
      task_id: 42,
      indexing_status: 'pending',
    })
    const indexed = makeAttachment({
      id: 77,
      project_id: null,
      task_id: 42,
      indexing_status: 'indexed',
    })

    taskUploadStub!.vm.$emit('attachment-uploaded', pending)
    await flushPromises()

    expect(setCacheSpy).toHaveBeenCalledWith('task', 42, pending)
    expect(taskUploadStub!.attributes('data-status')).toBe('pending')

    taskUploadStub!.vm.$emit('attachment-updated', indexed)
    await flushPromises()

    expect(setCacheSpy).toHaveBeenCalledWith('task', 42, indexed)
    expect(taskUploadStub!.attributes('data-status')).toBe('indexed')
  })

  it('updates phase attachments store cache on phase attachment upload and update', async () => {
    const attachmentsStore = useAttachmentsStore(pinia)
    const setCacheSpy = vi.spyOn(attachmentsStore, 'setCachedDocument')

    const wrapper = mount(PhaseColumn, {
      props: {
        phase: makePhase({ id: 9 }),
        tasks: [],
      },
      global: {
        plugins: [pinia],
        stubs: {
          TaskCard: { template: '<div></div>' },
          SkeletonLoader: { template: '<div></div>' },
          AttachmentUpload: AttachmentUploadStub,
          Modal: ModalStub,
        },
      },
    })
    await flushPromises()

    // Open dropdown menu and click "Gestionar documento"
    await wrapper.find('button').trigger('click')
    const manageButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Gestionar documento'))
    expect(manageButton).toBeDefined()
    await manageButton!.trigger('click')
    await flushPromises()

    const phaseUploadStub = wrapper.findComponent(AttachmentUploadStub)
    expect(phaseUploadStub.exists()).toBe(true)

    const pending = makeAttachment({
      id: 88,
      project_id: null,
      phase_id: 9,
      indexing_status: 'pending',
    })
    const indexed = makeAttachment({
      id: 88,
      project_id: null,
      phase_id: 9,
      indexing_status: 'indexed',
    })

    phaseUploadStub.vm.$emit('attachment-uploaded', pending)
    await flushPromises()

    expect(setCacheSpy).toHaveBeenCalledWith('phase', 9, pending)
    expect(phaseUploadStub.attributes('data-status')).toBe('pending')

    phaseUploadStub.vm.$emit('attachment-updated', indexed)
    await flushPromises()

    expect(setCacheSpy).toHaveBeenCalledWith('phase', 9, indexed)
    expect(phaseUploadStub.attributes('data-status')).toBe('indexed')
  })
})
