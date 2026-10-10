<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar />

    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
              Proyectos Archivados
            </h1>
            <p class="text-gray-600 mt-1 text-sm sm:text-base">
              Restaura tus proyectos o elimínalos definitivamente
            </p>
          </div>
          <router-link to="/dashboard"
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors duration-200 text-center">
            Volver al Dashboard
          </router-link>
        </div>
      </header>

      <!-- Archived Projects Grid -->
      <div class="mb-8">
        <div v-if="projectsStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader v-for="i in 3" :key="i" type="project-card" />
        </div>

        <div v-else-if="archivedProjects.length === 0" class="text-center py-12">
          <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes proyectos archivados</h3>
          <p class="text-gray-600 mb-6">Los proyectos que archives aparecerán aquí</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCard v-for="project in archivedProjects" :key="project.id" :project="project" archived
            @restore="handleRestore" @hard-delete="handleHardDeleteRequest" />
        </div>
      </div>
    </div>

    <!-- Permanent Delete Confirmation -->
    <ConfirmDialog :is-open="showDeleteModal" :loading="projectsStore.loading" title="Eliminar Definitivamente"
      :message="`¿Estás seguro que deseas eliminar definitivamente el proyecto '${projectToDelete?.name}'? Esta acción no se puede deshacer.`"
      :confirm-text="projectToDelete?.name" confirm-button-text="Eliminar Definitivamente"
      @confirm="confirmHardDelete" @cancel="cancelHardDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useToast } from '../composables/useToast'
import AppNavbar from '../components/layout/AppNavbar.vue'
import ProjectCard from '../components/ui/ProjectCard.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'

const projectsStore = useProjectsStore()
const { showSuccess, showError } = useToast()

const showDeleteModal = ref(false)
const projectToDelete = ref(null)

const archivedProjects = computed(() => projectsStore.archivedProjects)

const handleRestore = async (project) => {
  try {
    await projectsStore.restore(project.id)
    showSuccess('Proyecto restaurado')
  } catch (error) {
    console.error('Error restoring project:', error)
    showError('Error al restaurar el proyecto. Intenta nuevamente.')
  }
}

const handleHardDeleteRequest = (project) => {
  projectToDelete.value = project
  showDeleteModal.value = true
}

const confirmHardDelete = async () => {
  if (!projectToDelete.value) return

  try {
    await projectsStore.hardDelete(projectToDelete.value.id)
    showSuccess('Proyecto eliminado definitivamente')
    showDeleteModal.value = false
    projectToDelete.value = null
  } catch (error) {
    console.error('Error deleting project:', error)
    showError('Error al eliminar el proyecto. Intenta nuevamente.')
  }
}

const cancelHardDelete = () => {
  showDeleteModal.value = false
  projectToDelete.value = null
}

onMounted(async () => {
  await projectsStore.fetchArchived()
})
</script>
