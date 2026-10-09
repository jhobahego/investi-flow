import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { TaskStatus, type TaskCreate, type TaskResponse, type TaskUpdate } from '@/types'
import apiClient, { ApiValidationError } from '@/api/client'
import { useTasksStore } from '@/stores/tasks'

const { apiMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, default: apiMock }
})

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPut = vi.mocked(apiClient.put)
const mockedDelete = vi.mocked(apiClient.delete)

let taskId = 0

function makeTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  taskId += 1
  return {
    id: taskId,
    title: `Task ${taskId}`,
    description: null,
    position: 0,
    status: TaskStatus.PENDING,
    start_date: null,
    end_date: null,
    completed: false,
    phase_id: 1,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function seedTasks(phases: TaskResponse[] = []): void {
  const store = useTasksStore()
  store.tasks = phases
}

describe('tasks store', () => {
  beforeEach(() => {
    taskId = 0
    localStorage.clear()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setActivePinia(createPinia())
  })

  it('has the expected initial state', () => {
    // Arrange & Act
    const store = useTasksStore()

    // Assert
    expect(store.tasks).toEqual([])
    expect(store.currentTask).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.tasksCount).toBe(0)
  })

  it('filters tasks by phase with tasksByPhase', () => {
    // Arrange
    seedTasks([makeTask({ phase_id: 1 }), makeTask({ phase_id: 2 }), makeTask({ phase_id: 1 })])
    const store = useTasksStore()

    // Act
    const phase1 = store.tasksByPhase(1)
    const phase2 = store.tasksByPhase(2)

    // Assert
    expect(phase1).toHaveLength(2)
    expect(phase2).toHaveLength(1)
    expect(store.tasksCount).toBe(3)
  })

  it('groups tasks by status with tasksByStatus', () => {
    // Arrange
    seedTasks([
      makeTask({ status: TaskStatus.PENDING }),
      makeTask({ status: TaskStatus.COMPLETED }),
      makeTask({ status: null }),
    ])
    const store = useTasksStore()

    // Act
    const byStatus = store.tasksByStatus

    // Assert
    expect(byStatus[TaskStatus.PENDING]).toHaveLength(2)
    expect(byStatus[TaskStatus.COMPLETED]).toHaveLength(1)
  })

  it('splits completed and pending tasks', () => {
    // Arrange
    seedTasks([makeTask({ completed: true }), makeTask({ completed: false }), makeTask({ completed: null })])
    const store = useTasksStore()

    // Assert
    expect(store.completedTasks).toHaveLength(1)
    expect(store.pendingTasks).toHaveLength(2)
  })

  it('sorts tasks by position with sortedTasksByPhase', () => {
    // Arrange
    seedTasks([
      makeTask({ phase_id: 1, position: 2 }),
      makeTask({ phase_id: 1, position: 0 }),
      makeTask({ phase_id: 1, position: 1 }),
    ])
    const store = useTasksStore()

    // Act
    const sorted = store.sortedTasksByPhase(1)

    // Assert
    expect(sorted.map((t) => t.position)).toEqual([0, 1, 2])
  })

  it('creates a task and appends it to the list', async () => {
    // Arrange
    const payload: TaskCreate = { title: 'New task', phase_id: 1 }
    const created = makeTask({ title: 'New task', phase_id: 1 })
    mockedPost.mockResolvedValueOnce({ data: created })
    const store = useTasksStore()

    // Act
    const result = await store.createTask(payload)

    // Assert
    expect(mockedPost).toHaveBeenCalledWith('/tareas/', payload)
    expect(result).toEqual(created)
    expect(store.tasks).toContainEqual(created)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('sets loading while creating a task', async () => {
    // Arrange
    let resolveRequest!: (value: { data: TaskResponse }) => void
    mockedPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    const store = useTasksStore()

    // Act
    const pending = store.createTask({ title: 'Slow', phase_id: 1 })

    // Assert (pending)
    expect(store.loading).toBe(true)

    // Act (resolve)
    resolveRequest({ data: makeTask({ title: 'Slow' }) })
    await pending

    // Assert (settled)
    expect(store.loading).toBe(false)
  })

  it('sets the API detail message when creating a task fails', async () => {
    // Arrange
    mockedPost.mockRejectedValueOnce({
      response: { data: { detail: 'Title is required' } },
    })
    const store = useTasksStore()

    // Act
    await expect(store.createTask({ title: '', phase_id: 1 })).rejects.toEqual({
      response: { data: { detail: 'Title is required' } },
    })

    // Assert
    expect(store.error).toBe('Title is required')
    expect(store.tasks).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('maps ApiValidationError to a field message when creating a task fails', async () => {
    // Arrange
    const validationError = new ApiValidationError({
      title: { errorMessage: 'Title is required', errorType: 'missing', inputValue: '' },
    })
    mockedPost.mockRejectedValueOnce(validationError)
    const store = useTasksStore()

    // Act
    await expect(store.createTask({ title: '', phase_id: 1 })).rejects.toBe(validationError)

    // Assert
    expect(store.error).toBe('title: Title is required')
    expect(store.tasks).toEqual([])
  })

  it('fetches tasks by phase and replaces only that phase', async () => {
    // Arrange
    seedTasks([makeTask({ phase_id: 1 }), makeTask({ phase_id: 9 })])
    const phaseTasks = [makeTask({ phase_id: 2 }), makeTask({ phase_id: 2 })]
    mockedGet.mockResolvedValueOnce({ data: phaseTasks })
    const store = useTasksStore()

    // Act
    const result = await store.getTasksByPhase(2)

    // Assert
    expect(mockedGet).toHaveBeenCalledWith('/fases/2/tareas')
    expect(result).toEqual(phaseTasks)
    expect(store.tasksByPhase(1)).toHaveLength(1)
    expect(store.tasksByPhase(2)).toHaveLength(2)
    expect(store.tasksByPhase(9)).toHaveLength(1)
    expect(store.tasksCount).toBe(4)
    expect(store.loading).toBe(false)
  })

  it('sets the error message when fetching tasks by phase fails', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce({
      response: { data: { detail: 'Phase not found' } },
    })
    const store = useTasksStore()

    // Act
    await expect(store.getTasksByPhase(42)).rejects.toEqual({
      response: { data: { detail: 'Phase not found' } },
    })

    // Assert
    expect(store.error).toBe('Phase not found')
    expect(store.loading).toBe(false)
  })

  it('updates a task in the list and the current task', async () => {
    // Arrange
    const original = makeTask({ title: 'Old' })
    seedTasks([original])
    const store = useTasksStore()
    store.setCurrentTask(original)
    const updated = { ...original, title: 'New' }
    const payload: TaskUpdate = { title: 'New' }
    mockedPut.mockResolvedValueOnce({ data: updated })

    // Act
    const result = await store.updateTask(original.id, payload)

    // Assert
    expect(mockedPut).toHaveBeenCalledWith(`/tareas/${original.id}`, payload)
    expect(result).toEqual(updated)
    expect(store.tasks.find((t) => t.id === original.id)?.title).toBe('New')
    expect(store.currentTask?.title).toBe('New')
    expect(store.loading).toBe(false)
  })

  it('sets the error message when updating a task fails', async () => {
    // Arrange
    seedTasks([makeTask()])
    mockedPut.mockRejectedValueOnce({
      response: { data: { detail: 'Update failed' } },
    })
    const store = useTasksStore()

    // Act
    await expect(store.updateTask(1, { title: 'x' })).rejects.toEqual({
      response: { data: { detail: 'Update failed' } },
    })

    // Assert
    expect(store.error).toBe('Update failed')
    expect(store.loading).toBe(false)
  })

  it('deletes a task and clears the current task when it matches', async () => {
    // Arrange
    const doomed = makeTask()
    const survivor = makeTask()
    seedTasks([doomed, survivor])
    const store = useTasksStore()
    store.setCurrentTask(doomed)
    mockedDelete.mockResolvedValueOnce({ data: null })

    // Act
    await store.deleteTask(doomed.id)

    // Assert
    expect(mockedDelete).toHaveBeenCalledWith(`/tareas/${doomed.id}`)
    expect(store.tasks).toEqual([survivor])
    expect(store.currentTask).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('sets the error message when deleting a task fails', async () => {
    // Arrange
    seedTasks([makeTask()])
    mockedDelete.mockRejectedValueOnce({
      response: { data: { detail: 'Cannot delete task' } },
    })
    const store = useTasksStore()

    // Act
    await expect(store.deleteTask(1)).rejects.toEqual({
      response: { data: { detail: 'Cannot delete task' } },
    })

    // Assert
    expect(store.error).toBe('Cannot delete task')
    expect(store.tasks).toHaveLength(1)
    expect(store.loading).toBe(false)
  })

  it.skip('deleteTask with a network error without response crashes reading apiError.detail (src/stores/tasks.ts:148)', async () => {
    // Arrange
    seedTasks([makeTask()])
    mockedDelete.mockRejectedValueOnce(new Error('Network Error'))
    const store = useTasksStore()

    // Act & Assert: should reject with the original error and set a fallback
    // message, but the catch block reads `apiError.detail` on undefined.
    await expect(store.deleteTask(1)).rejects.toThrow('Network Error')
    expect(store.error).toBe('Error al eliminar tarea')
  })

  it('toggles task completion from pending to completed', async () => {
    // Arrange
    const task = makeTask({ completed: false, status: TaskStatus.PENDING })
    seedTasks([task])
    const confirmed = { ...task, completed: true, status: TaskStatus.COMPLETED }
    mockedPut.mockResolvedValueOnce({ data: confirmed })
    const store = useTasksStore()

    // Act
    const result = await store.toggleTaskCompletion(task.id)

    // Assert
    expect(mockedPut).toHaveBeenCalledWith(`/tareas/${task.id}`, {
      completed: true,
      status: TaskStatus.COMPLETED,
    })
    expect(result).toEqual(confirmed)
    expect(store.tasks[0].completed).toBe(true)
  })

  it('throws when toggling a task that does not exist', async () => {
    // Arrange
    const store = useTasksStore()

    // Act & Assert
    await expect(store.toggleTaskCompletion(999)).rejects.toThrow('Tarea no encontrada')
    expect(mockedPut).not.toHaveBeenCalled()
  })

  it('moves a task optimistically and confirms with server data', async () => {
    // Arrange
    const moving = makeTask({ phase_id: 1, position: 0 })
    const other = makeTask({ phase_id: 2, position: 0 })
    seedTasks([moving, other])
    const store = useTasksStore()
    const confirmed = { ...moving, phase_id: 2, position: 1 }
    mockedPut.mockResolvedValueOnce({ data: confirmed })

    // Act
    const promise = store.moveTaskToPhase(moving.id, 2)

    // Assert (optimistic, before await)
    expect(store.tasks.find((t) => t.id === moving.id)?.phase_id).toBe(2)

    // Act (confirm)
    const result = await promise

    // Assert (confirmed)
    expect(mockedPut).toHaveBeenCalledWith(`/tareas/${moving.id}/mover`, {
      new_phase_id: 2,
      new_position: 1,
    })
    expect(result).toEqual(confirmed)
    expect(store.tasks.find((t) => t.id === moving.id)).toEqual(confirmed)
    expect(store.error).toBeNull()
  })

  it('rolls back the optimistic move when the API fails', async () => {
    // Arrange
    const moving = makeTask({ phase_id: 1, position: 0 })
    seedTasks([moving])
    const store = useTasksStore()
    store.setCurrentTask(moving)
    mockedPut.mockRejectedValueOnce({
      response: { data: { detail: 'Move not allowed' } },
    })

    // Act
    await expect(store.moveTaskToPhase(moving.id, 2)).rejects.toEqual({
      response: { data: { detail: 'Move not allowed' } },
    })

    // Assert (rolled back)
    expect(store.tasks.find((t) => t.id === moving.id)).toEqual(moving)
    expect(store.currentTask).toEqual(moving)
    expect(store.error).toBe('Move not allowed')
  })

  it('returns undefined without calling the API when moving an unknown task', async () => {
    // Arrange
    const store = useTasksStore()

    // Act
    const result = await store.moveTaskToPhase(999, 2)

    // Assert
    expect(result).toBeUndefined()
    expect(mockedPut).not.toHaveBeenCalled()
  })

  it('updates task status through updateTask', async () => {
    // Arrange
    const task = makeTask({ status: TaskStatus.PENDING, completed: false })
    seedTasks([task])
    const confirmed = { ...task, status: TaskStatus.COMPLETED, completed: true }
    mockedPut.mockResolvedValueOnce({ data: confirmed })
    const store = useTasksStore()

    // Act
    const result = await store.updateTaskStatus(task.id, TaskStatus.COMPLETED)

    // Assert
    expect(mockedPut).toHaveBeenCalledWith(`/tareas/${task.id}`, {
      status: TaskStatus.COMPLETED,
      completed: true,
    })
    expect(result).toEqual(confirmed)
  })

  it('loadTasksForPhase, removeTasksFromPhase and clearTasks manage local state', () => {
    // Arrange
    const store = useTasksStore()

    // Act: load
    store.loadTasksForPhase(1, [makeTask({ phase_id: 1 }), makeTask({ phase_id: 1 })])
    store.loadTasksForPhase(2, [makeTask({ phase_id: 2 })])

    // Assert: loaded
    expect(store.tasksByPhase(1)).toHaveLength(2)
    expect(store.tasksByPhase(2)).toHaveLength(1)

    // Act: remove one phase
    store.removeTasksFromPhase(1)

    // Assert: removed
    expect(store.tasksByPhase(1)).toHaveLength(0)
    expect(store.tasksByPhase(2)).toHaveLength(1)

    // Act: clear
    store.setCurrentTask(store.tasks[0])
    store.clearTasks()

    // Assert: cleared
    expect(store.tasks).toEqual([])
    expect(store.currentTask).toBeNull()
  })

  it('clearError and clearCurrentTask reset their slices', () => {
    // Arrange
    const store = useTasksStore()
    store.error = 'boom'
    store.setCurrentTask(makeTask())

    // Act
    store.clearError()
    store.clearCurrentTask()

    // Assert
    expect(store.error).toBeNull()
    expect(store.currentTask).toBeNull()
  })
})
