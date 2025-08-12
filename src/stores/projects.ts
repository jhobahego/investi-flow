import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserProjects, getProjectById, createProject, getProjectTasks, createTask } from '../data/mockData'
import type { Project, Task, ContentBlock } from '../types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const currentTasks = ref<Task[]>([])

  const loadUserProjects = (userId: string): void => {
    projects.value = getUserProjects(userId)
  }

  const loadProject = (projectId: string): void => {
    currentProject.value = getProjectById(projectId) || null
    if (currentProject.value) {
      currentTasks.value = getProjectTasks(projectId)
    }
  }

  const addProject = (projectData: Partial<Project>): Project => {
    const newProject = createProject(projectData)
    projects.value.push(newProject)
    return newProject
  }

  const addTask = (taskData: Partial<Task>): Task => {
    const newTask = createTask(taskData)
    currentTasks.value.push(newTask)
    return newTask
  }

  const updateTaskPhase = (taskId: string, newPhaseId: string): void => {
    const task = currentTasks.value.find(t => t.id === taskId)
    if (task) {
      task.phase_id = newPhaseId
    }
  }

  const addContentBlock = (taskId: string, contentBlock: Partial<ContentBlock>): ContentBlock | undefined => {
    const task = currentTasks.value.find(t => t.id === taskId)
    if (task) {
      const newBlock: ContentBlock = {
        id: Date.now().toString(),
        type: contentBlock.type || 'user_text',
        content: contentBlock.content || '',
        created_at: new Date().toISOString(),
        ai_context: contentBlock.ai_context
      }
      task.content_blocks.push(newBlock)
      return newBlock
    }
  }

  return {
    projects,
    currentProject,
    currentTasks,
    loadUserProjects,
    loadProject,
    addProject,
    addTask,
    updateTaskPhase,
    addContentBlock
  }
})