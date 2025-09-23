import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient, { ApiValidationError } from '../api/client'
import { TaskStatus } from '../types'
import type {
  TaskResponse,
  TaskCreate,
  TaskUpdate,
  AttachmentResponse,
  ApiError,
} from '../types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<TaskResponse[]>([])
  const currentTask = ref<TaskResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const tasksCount = computed(() => tasks.value.length)

  const tasksByPhase = computed(() => {
    return (phaseId: number) => tasks.value.filter(task => task.phase_id === phaseId)
  })

  const tasksByStatus = computed(() => {
    return tasks.value.reduce((acc, task) => {
      const status = task.status || TaskStatus.PENDING
      if (!acc[status]) acc[status] = []
      acc[status].push(task)
      return acc
    }, {} as Record<TaskStatus, TaskResponse[]>)
  })

  const completedTasks = computed(() =>
    tasks.value.filter(task => task.completed === true)
  )

  const pendingTasks = computed(() =>
    tasks.value.filter(task => task.completed !== true)
  )

  const sortedTasksByPhase = computed(() => {
    return (phaseId: number) => {
      return tasksByPhase.value(phaseId).sort((a, b) => a.position - b.position)
    }
  })

  // Actions
  function clearError() {
    error.value = null
  }

  function setCurrentTask(task: TaskResponse | null) {
    currentTask.value = task
  }

  async function createTask(taskData: TaskCreate): Promise<TaskResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.post<TaskResponse>('/tareas/', taskData)

      // Agregar la nueva tarea a la lista
      tasks.value.push(data)

      return data
    } catch (err: any) {
      if (err instanceof ApiValidationError) {
        const firstError = err.getFirstError()
        if (firstError) {
          const message = `${firstError.field}: ${firstError.errorMessage}`
          error.value = message || 'Error al crear tarea'
        }
      } else {
        error.value = err.response?.data?.detail || 'Error al crear tarea'
      }

      console.error('Failed to create task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getTasksByPhase(phaseId: number): Promise<TaskResponse[]> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<TaskResponse[]>(`/fases/${phaseId}/tareas`)

      // Actualizar las tareas de esta fase en el store
      const otherTasks = tasks.value.filter(t => t.phase_id !== phaseId)
      tasks.value = [...otherTasks, ...data]

      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al obtener tareas'
      console.error(`Failed to get tasks for phase ${phaseId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTask(taskId: number, taskData: TaskUpdate): Promise<TaskResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.put<TaskResponse>(`/tareas/${taskId}`, taskData)

      // Actualizar en la lista de tareas
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = data
      }

      // Actualizar tarea actual si es la misma
      if (currentTask.value && currentTask.value.id === taskId) {
        currentTask.value = data
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al actualizar tarea'
      console.error(`Failed to update task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTask(taskId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/tareas/${taskId}`)

      // Remover de la lista
      tasks.value = tasks.value.filter(t => t.id !== taskId)

      // Limpiar tarea actual si es la misma
      if (currentTask.value && currentTask.value.id === taskId) {
        currentTask.value = null
      }
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al eliminar tarea'
      console.error(`Failed to delete task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleTaskCompletion(taskId: number): Promise<TaskResponse> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) {
      throw new Error('Tarea no encontrada')
    }

    const updateData: TaskUpdate = {
      completed: !task.completed,
      status: !task.completed ? TaskStatus.COMPLETED : TaskStatus.PENDING
    }

    return await updateTask(taskId, updateData)
  }

  async function moveTaskToPhase(taskId: number, newPhaseId: number): Promise<TaskResponse | undefined> {
    const newDataToUpdateInTask: { new_phase_id: number; new_position?: number } = { new_phase_id: newPhaseId }

    // Primero obtenemos las tareas de la fase destino para calcular la nueva posición
    const targetPhaseTasks = tasksByPhase.value(newPhaseId)
    const newPosition = targetPhaseTasks.length

    newDataToUpdateInTask.new_position = newPosition

    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.put<TaskResponse>(`/tareas/${taskId}/mover`, newDataToUpdateInTask)

      // Actualizar en la lista de tareas
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = data
      }

      // Actualizar tarea actual si es la misma
      if (currentTask.value && currentTask.value.id === taskId) {
        currentTask.value = data
      }

      return data
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al mover tarea'
      console.error(`Failed to move task ${taskId} to phase ${newPhaseId}:`, err)
    } finally {
      loading.value = false
    }
  }

  async function updateTaskStatus(taskId: number, status: TaskStatus): Promise<TaskResponse> {
    const updateData: TaskUpdate = {
      status,
      completed: status === TaskStatus.COMPLETED
    }

    return await updateTask(taskId, updateData)
  }

  async function uploadTaskDocument(taskId: number, file: File): Promise<AttachmentResponse> {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await apiClient.post<AttachmentResponse>(
        `/tareas/${taskId}/documentos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al subir documento'
      console.error(`Failed to upload document for task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getTaskDocument(taskId: number): Promise<AttachmentResponse | null> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<AttachmentResponse | null>(`/tareas/${taskId}/documentos`)
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al obtener documento'
      console.error(`Failed to get document for task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function loadTasksForPhase(phaseId: number, phaseTasks: TaskResponse[]) {
    // Filtrar las tareas de la fase actual y agregar las nuevas
    const otherTasks = tasks.value.filter(t => t.phase_id !== phaseId)
    tasks.value = [...otherTasks, ...phaseTasks]
  }

  function clearTasks() {
    tasks.value = []
    currentTask.value = null
  }

  function clearCurrentTask() {
    currentTask.value = null
  }

  function removeTasksFromPhase(phaseId: number) {
    tasks.value = tasks.value.filter(t => t.phase_id !== phaseId)
  }

  return {
    // State
    tasks,
    currentTask,
    loading,
    error,

    // Getters
    tasksCount,
    tasksByPhase,
    tasksByStatus,
    completedTasks,
    pendingTasks,
    sortedTasksByPhase,

    // Actions
    clearError,
    setCurrentTask,
    clearTasks,
    clearCurrentTask,
    removeTasksFromPhase,
    loadTasksForPhase,
    createTask,
    getTasksByPhase,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    moveTaskToPhase,
    updateTaskStatus,
    uploadTaskDocument,
    getTaskDocument
  }
})
