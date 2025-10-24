<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar />

    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Bienvenid@, {{ user?.full_name }}
            </h1>
            <p class="text-gray-600 mt-1">
              Gestiona tus proyectos de investigación y colabora con tu equipo
            </p>
          </div>
          <button @click="showCreateModal = true"
            class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
            <PlusIcon class="w-5 h-5" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-primary-100">
              <FolderIcon class="w-6 h-6 text-primary-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Proyectos</p>
              <p class="text-2xl font-bold text-gray-900">{{ projects.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100">
              <CheckCircleIcon class="w-6 h-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Activos</p>
              <p class="text-2xl font-bold text-gray-900">{{ activeProjects }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-secondary-100">
              <LexiAvatar :show-name="false" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Con Lexi</p>
              <p class="text-2xl font-bold text-gray-900">{{ projectsWithAI }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100">
              <UsersIcon class="w-6 h-6 text-yellow-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Colaboradores</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalCollaborators }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Mis Proyectos</h2>
          <div class="flex items-center space-x-4">
            <select v-model="filterStatus"
              class="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500">
              <option value="">Todos los estados</option>
              <option value="planning">Planificación</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completado</option>
              <option value="on_hold">En pausa</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div v-if="projectsStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader type="card" :count="6" />
        </div>

        <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
          <FolderIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes proyectos aún</h3>
          <p class="text-gray-600 mb-6">Crea tu primer proyecto de investigación y comienza a trabajar con Lexi</p>
          <button @click="showCreateModal = true"
            class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
            Crear mi primer proyecto
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCard v-for="project in filteredProjects" :key="project.id" :project="project"
            @click="navigateToProject(project.id)" @delete="handleDeleteProject" />
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <Modal :is-open="showCreateModal" @close="showCreateModal = false" title="Crear Nuevo Proyecto" size="lg">
      <form @submit.prevent="handleCreateProject" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del proyecto
          </label>
          <input id="name" type="text" required v-model="newProject.name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: Impacto de la IA en la Educación Superior" />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea id="description" rows="4" required v-model="newProject.description"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Describe brevemente tu proyecto de investigación..."></textarea>
        </div>

        <div class="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
          <div class="flex items-center space-x-2 mb-2">
            <LexiAvatar :show-name="false" class="scale-75" />
            <span class="text-sm font-medium text-secondary-700">Sugerencia de Lexi:</span>
          </div>
          <p class="text-sm text-gray-700">
            Un buen proyecto de investigación debe tener un título claro y específico,
            y una descripción que incluya el problema a resolver y la importancia del estudio.
          </p>
        </div>
      </form>

      <template #footer>
        <button type="button" @click="showCreateModal = false"
          class="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
          Cancelar
        </button>
        <button @click="handleCreateProject" :disabled="!newProject.name || !newProject.description || projectsStore.loading"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]">
          <span v-if="!projectsStore.loading">Crear Proyecto</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creando...
          </span>
        </button>
      </template>
    </Modal>

    <!-- Delete Project Confirmation -->
    <ConfirmDialog :is-open="showDeleteModal" :loading="projectsStore.loading" title="Eliminar Proyecto"
      :message="`¿Estás seguro que deseas eliminar el proyecto '${projectToDelete?.name}'? Esta acción no se puede deshacer.`"
      :confirm-text="projectToDelete?.name" confirm-button-text="Eliminar Proyecto" @confirm="confirmDeleteProject"
      @cancel="cancelDeleteProject" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'
import { useToast } from '../composables/useToast'
import AppNavbar from '../components/layout/AppNavbar.vue'
import ProjectCard from '../components/ui/ProjectCard.vue'
import Modal from '../components/ui/Modal.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import LexiAvatar from '../components/ui/LexiAvatar.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import {
  PlusIcon,
  FolderIcon,
  CheckCircleIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const { showSuccess, showError } = useToast()

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const projectToDelete = ref(null)
const filterStatus = ref('')

const newProject = reactive({
  name: '',
  description: ''
})

const user = computed(() => authStore.user)
const projects = computed(() => projectsStore.projects)

const filteredProjects = computed(() => {
  if (!filterStatus.value) return projects.value
  return projects.value.filter(p => p.status === filterStatus.value)
})

const activeProjects = computed(() =>
  projects.value.filter(p => p.status === 'in_progress').length
)

const projectsWithAI = computed(() =>
  projects.value.filter(p => p.status === 'in_progress').length // Simplified for mock
)

const totalCollaborators = computed(() =>
  projects.value.length // Simplified, no collaborators in current API
)

const navigateToProject = (projectId) => {
  projectsStore.setCurrentProjectId(projectId)
  router.push(`/project/${projectId}`)
}

const handleCreateProject = async () => {
  if (!newProject.name || !newProject.description) return

  try {
    await projectsStore.createProject({
      name: newProject.name,
      description: newProject.description
    })

    showSuccess('Proyecto creado exitosamente')

    newProject.name = ''
    newProject.description = ''
    showCreateModal.value = false
  } catch (error) {
    console.error('Error creating project:', error)
    showError('Error al crear el proyecto. Intenta nuevamente.')
  }
}

const handleDeleteProject = (project) => {
  projectToDelete.value = project
  showDeleteModal.value = true
}

const confirmDeleteProject = async () => {
  if (!projectToDelete.value) return

  try {
    await projectsStore.deleteProject(projectToDelete.value.id)
    showSuccess('Proyecto eliminado exitosamente')
    showDeleteModal.value = false
    projectToDelete.value = null
  } catch (error) {
    console.error('Error deleting project:', error)
    showError('Error al eliminar el proyecto. Intenta nuevamente.')
  }
}

const cancelDeleteProject = () => {
  showDeleteModal.value = false
  projectToDelete.value = null
}

onMounted(async () => {
  await projectsStore.fetchProjects()
})
</script>