import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient, { ApiValidationError } from '../api/client'
import type { AttachmentResponse } from '../types'

export const useAttachmentsStore = defineStore('attachments', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache para documentos cargados
  const attachments = ref<Record<string, AttachmentResponse | null>>({})

  // Actions
  function clearError() {
    error.value = null
  }

  function getCacheKey(entityType: 'project' | 'phase' | 'task', entityId: number): string {
    return `${entityType}-${entityId}`
  }

  async function uploadDocument(
    entityType: 'project' | 'phase' | 'task',
    entityId: number,
    file: File
  ): Promise<AttachmentResponse> {
    loading.value = true
    error.value = null
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      let endpoint = ''
      switch (entityType) {
        case 'project':
          endpoint = `/proyectos/${entityId}/documentos`
          break
        case 'phase':
          endpoint = `/fases/${entityId}/documentos`
          break
        case 'task':
          endpoint = `/tareas/${entityId}/documentos`
          break
      }

      const { data } = await apiClient.post<AttachmentResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Actualizar cache
      const cacheKey = getCacheKey(entityType, entityId)
      attachments.value[cacheKey] = data

      return data
    } catch (err: any) {
      if (err instanceof ApiValidationError) {
        const firstError = err.getFirstError()
        error.value = firstError ? firstError.errorMessage : 'Error al subir documento'
      } else {
        error.value = err.response?.data?.detail || 'Error al subir documento'
      }
      console.error(`Failed to upload document for ${entityType} ${entityId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getDocument(
    entityType: 'project' | 'phase' | 'task',
    entityId: number
  ): Promise<AttachmentResponse | null> {
    const cacheKey = getCacheKey(entityType, entityId)
    
    // Retornar del cache si existe
    if (cacheKey in attachments.value) {
      return attachments.value[cacheKey]
    }

    loading.value = true
    error.value = null
    
    try {
      let endpoint = ''
      switch (entityType) {
        case 'project':
          endpoint = `/proyectos/${entityId}/documentos`
          break
        case 'phase':
          endpoint = `/fases/${entityId}/documentos`
          break
        case 'task':
          endpoint = `/tareas/${entityId}/documentos`
          break
      }

      const { data } = await apiClient.get<AttachmentResponse | null>(endpoint)
      
      // Actualizar cache
      attachments.value[cacheKey] = data

      return data
    } catch (err: any) {
      // Si es un 404, significa que no hay documento
      if (err.response?.status === 404) {
        attachments.value[cacheKey] = null
        return null
      }
      
      error.value = err.response?.data?.detail || 'Error al obtener documento'
      console.error(`Failed to get document for ${entityType} ${entityId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearCache(entityType?: 'project' | 'phase' | 'task', entityId?: number) {
    if (entityType && entityId) {
      const cacheKey = getCacheKey(entityType, entityId)
      delete attachments.value[cacheKey]
    } else {
      attachments.value = {}
    }
  }

  function getCachedDocument(entityType: 'project' | 'phase' | 'task', entityId: number): AttachmentResponse | null | undefined {
    const cacheKey = getCacheKey(entityType, entityId)
    return attachments.value[cacheKey]
  }

  return {
    // State
    loading,
    error,
    attachments,

    // Actions
    clearError,
    uploadDocument,
    getDocument,
    clearCache,
    getCachedDocument
  }
})