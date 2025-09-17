import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient, { ApiValidationError } from '../api/client'
import type {
  PhaseResponse,
  PhaseCreate,
  PhaseUpdate,
  PhaseOrder,
  AttachmentResponse,
  ApiError
} from '../types'

export const usePhasesStore = defineStore('phases', () => {
  const phases = ref<PhaseResponse[]>([])
  const currentPhase = ref<PhaseResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const phasesCount = computed(() => phases.value.length)

  const phasesByProject = computed(() => {
    return (projectId: number) => phases.value.filter(phase => phase.project_id === projectId)
  })

  const sortedPhases = computed(() => {
    return [...phases.value].sort((a, b) => a.position - b.position)
  })

  // Actions
  function clearError() {
    error.value = null
  }

  function setCurrentPhase(phase: PhaseResponse | null) {
    currentPhase.value = phase
  }

  async function createPhase(phaseData: PhaseCreate): Promise<PhaseResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.post<PhaseResponse>('/fases/', phaseData)

      // Agregar la nueva fase a la lista
      phases.value.push(data)

      return data
    } catch (err: any) {
      if (err instanceof ApiValidationError) {
        const firstError = err.getFirstError()
        if (firstError) {
          const message = `${firstError.field}: ${firstError.errorMessage}`
          error.value = message || 'Error al crear fase'
        }
      } else {
        error.value = err.response?.data?.detail || 'Error al crear fase'
      }

      console.error('Failed to create phase:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getPhaseById(phaseId: number): Promise<PhaseResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<PhaseResponse>(`/fases/${phaseId}`)
      currentPhase.value = data
      return data
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al obtener fase'
      console.error(`Failed to get phase ${phaseId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePhase(phaseId: number, phaseData: PhaseUpdate): Promise<PhaseResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.put<PhaseResponse>(`/fases/${phaseId}`, phaseData)

      // Actualizar en la lista de fases
      const index = phases.value.findIndex(p => p.id === phaseId)
      if (index !== -1) {
        phases.value[index] = data
      }

      // Actualizar fase actual si es la misma
      if (currentPhase.value && currentPhase.value.id === phaseId) {
        currentPhase.value = data
      }

      return data
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al actualizar fase'
      console.error(`Failed to update phase ${phaseId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePhase(phaseId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/fases/${phaseId}`)

      // Remover de la lista
      phases.value = phases.value.filter(p => p.id !== phaseId)

      // Limpiar fase actual si es la misma
      if (currentPhase.value && currentPhase.value.id === phaseId) {
        currentPhase.value = null
      }
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al eliminar fase'
      console.error(`Failed to delete phase ${phaseId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function reorderProjectPhases(projectId: number, phaseOrders: PhaseOrder[]): Promise<PhaseResponse[]> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.put<PhaseResponse[]>(
        `/fases/project/${projectId}/reorder`,
        phaseOrders
      )

      // Actualizar las fases en la lista con las nuevas posiciones
      data.forEach(updatedPhase => {
        const index = phases.value.findIndex(p => p.id === updatedPhase.id)
        if (index !== -1) {
          phases.value[index] = updatedPhase
        }
      })

      return data
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al reordenar fases'
      console.error(`Failed to reorder phases for project ${projectId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadPhaseDocument(phaseId: number, file: File): Promise<AttachmentResponse> {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await apiClient.post<AttachmentResponse>(
        `/fases/${phaseId}/documentos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return data
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al subir documento'
      console.error(`Failed to upload document for phase ${phaseId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getPhaseDocument(phaseId: number): Promise<AttachmentResponse | null> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<AttachmentResponse | null>(`/fases/${phaseId}/documentos`)
      return data
    } catch (err: any) {
      const apiError: ApiError = err.response?.data
      error.value = apiError.detail || 'Error al obtener documento'
      console.error(`Failed to get document for phase ${phaseId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function loadPhasesForProject(projectPhases: PhaseResponse[]) {
    // Filtrar las fases del proyecto actual y agregar las nuevas
    const otherPhases = phases.value.filter(p =>
      !projectPhases.some(newPhase => newPhase.id === p.id)
    )
    phases.value = [...otherPhases, ...projectPhases]
  }

  function clearPhases() {
    phases.value = []
    currentPhase.value = null
  }

  function clearCurrentPhase() {
    currentPhase.value = null
  }

  return {
    // State
    phases,
    currentPhase,
    loading,
    error,

    // Getters
    phasesCount,
    phasesByProject,
    sortedPhases,

    // Actions
    clearError,
    setCurrentPhase,
    clearPhases,
    clearCurrentPhase,
    loadPhasesForProject,
    createPhase,
    getPhaseById,
    updatePhase,
    deletePhase,
    reorderProjectPhases,
    uploadPhaseDocument,
    getPhaseDocument
  }
})
