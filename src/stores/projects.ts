import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockPhases, getProjectTasks, createTask } from '../data/mockData' // Keep mock phases for now
import type { Project, Phase, Task, ProjectCreatePayload, ProjectUpdatePayload } from '../types'
import apiClient from '../api/client'

// Extend the Project type for the frontend to include phases temporarily
export type ProjectWithPhases = Project & { phases: Phase[] }

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<ProjectWithPhases[]>([])
  const currentProjectId = ref<number | null>(null)
  const tasks = ref<Task[]>([])

  const currentProject = computed(() => {
    return projects.value.find((p: ProjectWithPhases) => p.id === currentProjectId.value) || null
  })

  const currentTasks = computed(() => {
    if (!currentProjectId.value) return []
    return tasks.value.filter(task => task.project_id === currentProjectId.value!.toString())
  })

  function setCurrentProjectId(id: number) {
    currentProjectId.value = id
  }

  function loadProject(id: string | number) {
    const projectId = typeof id === 'string' ? parseInt(id) : id
    setCurrentProjectId(projectId)
    loadProjectTasks(projectId)
  }

  function loadProjectTasks(projectId: number) {
    // Load tasks from mock data for now
    const projectTasks = getProjectTasks(projectId.toString())
    tasks.value = [...tasks.value.filter(t => t.project_id !== projectId.toString()), ...projectTasks]
  }

  function addTask(taskData: { project_id: string | number, phase_id: string, title: string, created_by: number }) {
    const newTask = createTask({
      project_id: taskData.project_id.toString(),
      phase_id: taskData.phase_id,
      title: taskData.title,
      created_by: taskData.created_by.toString()
    })
    tasks.value.push(newTask)
    return newTask
  }

  function updateTaskPhase(taskId: string, newPhaseId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.phase_id = newPhaseId
    }
  }

  function addContentBlock(taskId: string, contentBlock: { type: 'user_text' | 'ai_suggestion', content: string, ai_context?: string }) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      const newBlock = {
        id: Date.now().toString(),
        type: contentBlock.type,
        content: contentBlock.content,
        created_at: new Date().toISOString(),
        ...(contentBlock.ai_context && { ai_context: contentBlock.ai_context })
      }
      task.content_blocks = task.content_blocks || []
      task.content_blocks.push(newBlock)
    }
  }

  async function fetchProjects() {
    try {
      const { data } = await apiClient.get<Project[]>('/proyectos/')
      // Attach mock phases to each project to avoid breaking UI
      projects.value = data.map((p: Project) => ({
        ...p,
        phases: mockPhases
      }))
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      projects.value = []
    }
  }

  async function fetchProjectById(id: number) {
    try {
      const { data } = await apiClient.get<Project>(`/proyectos/${id}`)
      const existingProjectIndex = projects.value.findIndex((p: ProjectWithPhases) => p.id === id)
      const projectWithPhases: ProjectWithPhases = { ...data, phases: mockPhases }

      if (existingProjectIndex !== -1) {
        projects.value[existingProjectIndex] = projectWithPhases
      } else {
        projects.value.push(projectWithPhases)
      }
      setCurrentProjectId(id)
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error)
    }
  }

  async function createProject(projectData: ProjectCreatePayload) {
    try {
      const { data } = await apiClient.post<Project>('/proyectos/', projectData)
      const newProject: ProjectWithPhases = { ...data, phases: mockPhases }
      projects.value.unshift(newProject) // Add to the beginning of the list
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  async function updateProject(id: number, projectData: ProjectUpdatePayload) {
    try {
      const { data } = await apiClient.put<Project>(`/proyectos/${id}`, projectData)
      const index = projects.value.findIndex((p: ProjectWithPhases) => p.id === id)
      if (index !== -1) {
        // Preserve phases
        const updatedProject: ProjectWithPhases = { ...projects.value[index], ...data }
        projects.value[index] = updatedProject
      }
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error)
      throw error
    }
  }

  async function deleteProject(id: number) {
    try {
      await apiClient.delete(`/proyectos/${id}`)
      projects.value = projects.value.filter((p: ProjectWithPhases) => p.id !== id)
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error)
      throw error
    }
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    currentTasks,
    tasks,
    setCurrentProjectId,
    loadProject,
    loadProjectTasks,
    addTask,
    updateTaskPhase,
    addContentBlock,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject
  }
})
