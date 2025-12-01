import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient, { ApiValidationError } from '../api/client'
import { ProjectStatus } from '../types'
import type {
  ProjectResponse,
  ProjectCreate,
  ProjectUpdate,
  ProjectWithPhases,
  AttachmentResponse
} from '../types'

// Cache interface
interface ProjectCache {
  data: ProjectWithPhases
  etag: string | null
  timestamp: number
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<ProjectResponse[]>([])
  const currentProject = ref<ProjectWithPhases | null>(null)
  const currentProjectId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Cache for project with phases
  const projectCache = ref<Map<number, ProjectCache>>(new Map())

  // Computed properties
  const projectsCount = computed(() => projects.value.length)

  const projectsByStatus = computed(() => {
    return projects.value.reduce((acc, project) => {
      const status = project.status
      if (!status) return acc

      if (!acc[status]) acc[status] = []
      acc[status].push(project)
      return acc
    }, {} as Record<string, ProjectResponse[]>)
  })

  // Actions
  function setCurrentProjectId(id: number | null) {
    currentProjectId.value = id
  }

  function clearError() {
    error.value = null
  }

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<ProjectResponse[]>('/proyectos/')
      projects.value = data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar proyectos'
      console.error('Failed to fetch projects:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchProjectById(id: number): Promise<ProjectResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<ProjectResponse>(`/proyectos/${id}`)
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al cargar proyecto'
      console.error(`Failed to fetch project ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchProjectWithPhases(
    id: number,
    options: { forceRefresh?: boolean } = {}
  ): Promise<ProjectWithPhases> {
    const { forceRefresh = false } = options
    
    // Check cache first (if not forcing refresh)
    if (!forceRefresh && projectCache.value.has(id)) {
      const cached = projectCache.value.get(id)!
      const cacheAge = Date.now() - cached.timestamp
      const CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes
      
      // If cache is still fresh, use it
      if (cacheAge < CACHE_MAX_AGE) {
        currentProject.value = cached.data
        currentProjectId.value = id
        return cached.data
      }
    }
    
    loading.value = true
    error.value = null
    
    // Get cached etag if available (declare outside try for catch block access)
    const cached = projectCache.value.get(id)
    
    try {
      const headers: Record<string, string> = {}
      
      if (cached?.etag && !forceRefresh) {
        headers['If-None-Match'] = cached.etag
      }
      if (forceRefresh) {
        headers['Cache-Control'] = 'no-cache'
      }
      const url = `/proyectos/${id}/phases`
      
      const response = await apiClient.get<ProjectWithPhases>(
        url,
        { headers }
      )
      
      // If we get 304 Not Modified, use cached data
      if (response.status === 304 && cached) {
        // Update timestamp but keep data
        projectCache.value.set(id, {
          ...cached,
          timestamp: Date.now()
        })
        currentProject.value = cached.data
        currentProjectId.value = id
        return cached.data
      }
      
      // New data received
      const data = response.data
      const etag = response.headers['etag'] || null
      
      // Update cache
      projectCache.value.set(id, {
        data,
        etag,
        timestamp: Date.now()
      })
      
      currentProject.value = data
      currentProjectId.value = id
      return data
    } catch (err: any) {
      // If we have cached data and error is not critical, use cache
      if (cached && err.response?.status !== 404) {
        console.warn('Using cached data due to error:', err)
        currentProject.value = cached.data
        currentProjectId.value = id
        return cached.data
      }
      
      error.value = err.response?.data?.detail || 'Error al cargar proyecto con fases'
      console.error(`Failed to fetch project with phases ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProject(projectData: ProjectCreate): Promise<ProjectResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.post<ProjectResponse>('/proyectos/', projectData)

      // Agregar el nuevo proyecto a la lista (convertir ProjectResponse a ProjectResponse)
      const newProjectListItem: ProjectResponse = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status ?? ProjectStatus.PLANNING,
        institution: data.institution,
        research_group: data.research_group,
        research_type: data.research_type,
        category: data.category,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      projects.value.unshift(newProjectListItem)
      return data
    } catch (err: any) {
      if (err instanceof ApiValidationError) {
        const firstError = err.getFirstError()
        if (firstError) {
          const message = `${firstError.field}: ${firstError.errorMessage}`
          error.value = message || 'Error al crear proyecto'
        }
      } else {
        error.value = err.response?.data?.detail || 'Error al crear proyecto'
      }

      console.error('Failed to create project:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProject(id: number, projectData: ProjectUpdate): Promise<ProjectResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.put<ProjectResponse>(`/proyectos/${id}`, projectData)

      // Actualizar en la lista de proyectos
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        const updatedProjectListItem: ProjectResponse = {
          id: data.id,
          name: data.name,
          description: data.description,
          status: data.status ?? ProjectStatus.PLANNING,
          institution: data.institution,
          research_group: data.research_group,
          research_type: data.research_type,
          category: data.category,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
        projects.value[index] = updatedProjectListItem
      }

      // Actualizar proyecto actual si es el mismo
      if (currentProject.value && currentProject.value.id === id) {
        currentProject.value = { ...currentProject.value, ...data }
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al actualizar proyecto'
      console.error(`Failed to update project ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProject(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/proyectos/${id}`)

      // Remover de la lista
      projects.value = projects.value.filter(p => p.id !== id)

      // Limpiar proyecto actual si es el mismo
      if (currentProjectId.value === id) {
        currentProject.value = null
        currentProjectId.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al eliminar proyecto'
      console.error(`Failed to delete project ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadProjectDocument(projectId: number, file: File): Promise<AttachmentResponse> {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await apiClient.post<AttachmentResponse>(
        `/proyectos/${projectId}/documentos`,
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
      console.error(`Failed to upload document for project ${projectId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getProjectDocument(projectId: number): Promise<AttachmentResponse | null> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<AttachmentResponse | null>(`/proyectos/${projectId}/documentos`)
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Error al obtener documento'
      console.error(`Failed to get document for project ${projectId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearCurrentProject() {
    currentProject.value = null
    currentProjectId.value = null
  }
  
  function invalidateProjectCache(id: number) {
    projectCache.value.delete(id)
  }
  
  function clearProjectCache() {
    projectCache.value.clear()
  }

  return {
    // State
    projects,
    currentProject,
    currentProjectId,
    loading,
    error,

    // Getters
    projectsCount,
    projectsByStatus,

    // Actions
    setCurrentProjectId,
    clearError,
    clearCurrentProject,
    invalidateProjectCache,
    clearProjectCache,
    fetchProjects,
    fetchProjectById,
    fetchProjectWithPhases,
    createProject,
    updateProject,
    deleteProject,
    uploadProjectDocument,
    getProjectDocument
  }
})