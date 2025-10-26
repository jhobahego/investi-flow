import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient, { ApiValidationError } from '../api/client'
import type { ApiError, AttachmentResponse } from '../types'

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

  async function downloadDocument(
    entityType: 'project' | 'phase' | 'task',
    entityId: number,
    fileName?: string
  ): Promise<void> {
    try {
      let endpoint = ''
      switch (entityType) {
        case 'project':
          endpoint = `/proyectos/${entityId}/descargar-documento`
          break
        case 'phase':
          endpoint = `/fases/${entityId}/descargar-documento`
          break
        case 'task':
          endpoint = `/tareas/${entityId}/descargar-documento`
          break
      }

      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      })

      // Obtener el nombre del archivo desde el header Content-Disposition
      const contentDisposition = response.headers['content-disposition']
      let downloadFileName = fileName || 'documento.pdf'
      
      if (contentDisposition) {
        // Intentar extraer el nombre del archivo desde el header
        // Buscar primero filename* (RFC 5987 con encoding UTF-8)
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/)
        if (filenameStarMatch) {
          downloadFileName = decodeURIComponent(filenameStarMatch[1])
        } else {
          // Fallback a filename normal
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/)
          if (filenameMatch) {
            downloadFileName = filenameMatch[1]
          }
        }
      }

      // Crear un objeto URL para el blob y descargarlo
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName
      document.body.appendChild(link)
      link.click()
      
      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      const apiError: ApiError = err.response.data
      error.value = apiError.detail || 'Error al descargar documento'
      console.error(`Failed to download document for ${entityType} ${entityId}:`, err)
      throw err
    }
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
    downloadDocument,
    clearCache,
    getCachedDocument
  }
})