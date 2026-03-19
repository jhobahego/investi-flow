import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'
import type {
  BibliographyResponse,
  BibliographyCreate,
  BibliographyUpdate
} from '../types'

export const useBibliographyStore = defineStore('bibliography', () => {
  const bibliographies = ref<BibliographyResponse[]>([])
  const currentBibliography = ref<BibliographyResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const bibliographiesCount = computed(() => bibliographies.value.length)

  // Actions
  function clearError() {
    error.value = null
  }

  async function fetchBibliographies(projectId: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<BibliographyResponse[]>(`/proyectos/${projectId}/bibliografias`)
      bibliographies.value = data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar bibliografías'
      console.error('Failed to fetch bibliographies:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createBibliography(projectId: number, bibData: BibliographyCreate): Promise<BibliographyResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.post<BibliographyResponse>(`/proyectos/${projectId}/bibliografias`, bibData)
      bibliographies.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al crear bibliografía'
      console.error('Failed to create bibliography:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBibliography(projectId: number, bibId: number, bibData: BibliographyUpdate): Promise<BibliographyResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.put<BibliographyResponse>(`/proyectos/${projectId}/bibliografias/${bibId}`, bibData)
      
      const index = bibliographies.value.findIndex(b => b.id === bibId)
      if (index !== -1) {
        bibliographies.value[index] = data
      }
      
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al actualizar bibliografía'
      console.error(`Failed to update bibliography ${bibId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBibliography(projectId: number, bibId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/proyectos/${projectId}/bibliografias/${bibId}`)
      bibliographies.value = bibliographies.value.filter(b => b.id !== bibId)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al eliminar bibliografía'
      console.error(`Failed to delete bibliography ${bibId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadBibliographyDocument(projectId: number, bibId: number, file: File): Promise<BibliographyResponse> {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await apiClient.post<BibliographyResponse>(
        `/proyectos/${projectId}/bibliografias/${bibId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      const index = bibliographies.value.findIndex(b => b.id === bibId)
      if (index !== -1) {
        bibliographies.value[index] = data
      }
      
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al subir documento de bibliografía'
      console.error(`Failed to upload document for bibliography ${bibId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    bibliographies,
    currentBibliography,
    loading,
    error,
    bibliographiesCount,
    clearError,
    fetchBibliographies,
    createBibliography,
    updateBibliography,
    deleteBibliography,
    uploadBibliographyDocument
  }
})
