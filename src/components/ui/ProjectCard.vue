<template>
  <div
    class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary-300 relative group">
    <!-- Delete button -->
    <button @click.stop="$emit('delete', project)"
      class="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
      title="Eliminar proyecto">
      <TrashIcon class="w-4 h-4" />
    </button>

    <div class="p-6 cursor-pointer" @click="$emit('click')">
      <div class="flex items-start justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 pr-8">{{ project.name }}</h3>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 mt-1"
          :class="statusClasses">
          {{ statusText }}
        </span>
      </div>

      <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ project.description }}</p>

      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="flex -space-x-2 overflow-hidden">
            <div
              class="h-6 w-6 rounded-full ring-2 ring-white bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span class="text-white text-xs font-bold">U</span>
            </div>
          </div>
          <span class="text-xs text-gray-500">
            {{ totalMembers }} miembro{{ totalMembers !== 1 ? 's' : '' }}
          </span>
        </div>

        <span class="text-xs text-gray-500">
          {{ formatDate(project.updated_at) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'delete'])

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

const ownerAvatar = computed(() => {
  // Generate avatar based on project owner_id
  return `https://i.pravatar.cc/150?u=${props.project.owner_id}`
})

const ownerName = computed(() => `Usuario ${props.project.owner_id}`)

const totalMembers = computed(() => 1) // Only owner for now

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