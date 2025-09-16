import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'
import type { ProjectResponse } from '../types'

export const useSearchStore = defineStore('search', () => {
  const results = ref<ProjectResponse[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastQuery = ref<string>('')

  // Actions
  function clearError() {
    error.value = null
  }

  function clearResults() {
    results.value = []
    lastQuery.value = ''
    error.value = null
  }

  async function searchProjects(query: string) {
    if (!query.trim()) {
      clearResults()
      return
    }

    isLoading.value = true
    error.value = null
    lastQuery.value = query

    try {
      const { data } = await apiClient.get<ProjectResponse[]>('/proyectos/search', {
        params: { query: query.trim() }
      })
      results.value = data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al realizar la búsqueda'
      console.error('Failed to search projects:', err)
      results.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    results,
    isLoading,
    error,
    lastQuery,

    // Actions
    clearError,
    clearResults,
    searchProjects
  }
})