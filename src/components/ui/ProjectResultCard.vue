<template>
  <router-link :to="{ name: 'Project', params: { id: project.id } }"
    class="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary-300">
    <div class="p-6">
      <div class="flex items-start justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">{{ project.name }}</h3>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="statusClasses">
          {{ statusText }}
        </span>
      </div>

      <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ project.description }}</p>

      <div class="space-y-2 mb-4">
        <div v-if="project.institution" class="flex items-center text-xs text-gray-500">
          <BuildingLibraryIcon class="h-4 w-4 mr-1" />
          <span>{{ project.institution }}</span>
        </div>

        <div v-if="project.research_group" class="flex items-center text-xs text-gray-500">
          <UserGroupIcon class="h-4 w-4 mr-1" />
          <span>{{ project.research_group }}</span>
        </div>

        <div v-if="project.category" class="flex items-center text-xs text-gray-500">
          <TagIcon class="h-4 w-4 mr-1" />
          <span>{{ project.category }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="flex -space-x-2 overflow-hidden">
            <div
              class="h-6 w-6 rounded-full ring-2 ring-white bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span class="text-white text-xs font-bold">{{ ownerInitial }}</span>
            </div>
          </div>
          <span class="text-xs text-gray-500">Proyecto</span>
        </div>

        <span class="text-xs text-gray-500">
          {{ formatDate(project.updated_at) }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { BuildingLibraryIcon, UserGroupIcon, TagIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const statusClasses = computed(() => {
  const statusMap = {
    'planning': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-green-100 text-green-800',
    'completed': 'bg-gray-100 text-gray-800',
    'on_hold': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return statusMap[props.project.status] || 'bg-gray-100 text-gray-800'
})

const statusText = computed(() => {
  const statusMap = {
    'planning': 'Planificación',
    'in_progress': 'En progreso',
    'completed': 'Completado',
    'on_hold': 'En pausa',
    'cancelled': 'Cancelado'
  }
  return statusMap[props.project.status] || 'Desconocido'
})

const ownerInitial = computed(() => {
  // Generate initial based on project name or ID
  return props.project.name?.charAt(0)?.toUpperCase() || 'P'
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>