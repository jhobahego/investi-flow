import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient, { ApiValidationError } from '../api/client'
import type { ApiError, AttachmentResponse } from '../types'

export type AttachmentEntityType = 'project' | 'phase' | 'task'

export const useAttachmentsStore = defineStore('attachments', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache para documentos cargados
  const attachments = ref<Record<string, AttachmentResponse | null>>({})

  // Actions
  function clearError() {
    error.value = null
  }

  function getCacheKey(entityType: AttachmentEntityType, entityId: number): string {
    return `${entityType}-${entityId}`
  }

  function getDocumentEndpoint(entityType: AttachmentEntityType, entityId: number): string {
    switch (entityType) {
      case 'project':
        return `/proyectos/${entityId}/documentos`
      case 'phase':
        return `/fases/${entityId}/documentos`
      case 'task':
        return `/tareas/${entityId}/documentos`
    }
  }

  async function uploadDocument(
    entityType: AttachmentEntityType,
    entityId: number,
    file: File
  ): Promise<AttachmentResponse> {
    loading.value = true
    error.value = null
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const endpoint = getDocumentEndpoint(entityType, entityId)

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

  async function replaceDocument(
    entityType: AttachmentEntityType,
    entityId: number,
    file: File
  ): Promise<AttachmentResponse> {
    loading.value = true
    error.value = null
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const endpoint = getDocumentEndpoint(entityType, entityId)

      const { data } = await apiClient.put<AttachmentResponse>(
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
        error.value = firstError ? firstError.errorMessage : 'Error al reemplazar documento'
      } else {
        error.value = err.response?.data?.detail || 'Error al reemplazar documento'
      }
      console.error(`Failed to replace document for ${entityType} ${entityId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function getDocument(
    entityType: AttachmentEntityType,
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
      const endpoint = getDocumentEndpoint(entityType, entityId)

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

  /**
   * Refresca silenciosamente el documento desde la API sin activar loading
   * y sin sobrescribir la cache si la respuesta es null o 404.
   */
  async function refreshDocument(
    entityType: AttachmentEntityType,
    entityId: number
  ): Promise<AttachmentResponse | null> {
    const cacheKey = getCacheKey(entityType, entityId)

    try {
      const endpoint = getDocumentEndpoint(entityType, entityId)
      const { data } = await apiClient.get<AttachmentResponse | null>(endpoint)

      if (data !== null && data !== undefined) {
        attachments.value[cacheKey] = data
        return data
      }

      return null
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null
      }

      console.error(`Failed to refresh document for ${entityType} ${entityId}:`, err)
      throw err
    }
  }

  function setCachedDocument(
    entityType: AttachmentEntityType,
    entityId: number,
    attachment: AttachmentResponse | null
  ) {
    const cacheKey = getCacheKey(entityType, entityId)
    attachments.value[cacheKey] = attachment
  }

  function clearCache(entityType?: AttachmentEntityType, entityId?: number) {
    if (entityType && entityId) {
      const cacheKey = getCacheKey(entityType, entityId)
      delete attachments.value[cacheKey]
    } else {
      attachments.value = {}
    }
  }

  function getCachedDocument(entityType: AttachmentEntityType, entityId: number): AttachmentResponse | null | undefined {
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
    replaceDocument,
    getDocument,
    refreshDocument,
    setCachedDocument,
    downloadDocument,
    clearCache,
    getCachedDocument
  }
})