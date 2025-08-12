<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-primary-300"
       @click="$emit('click')">
    <div class="p-6">
      <div class="flex items-start justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">{{ project.title }}</h3>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusClasses">
          {{ statusText }}
        </span>
      </div>
      
      <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ project.description }}</p>
      
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="flex -space-x-2 overflow-hidden">
            <img class="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                 :src="ownerAvatar"
                 :alt="ownerName">
            <img v-for="collaborator in collaboratorAvatars" 
                 :key="collaborator.id"
                 class="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                 :src="collaborator.avatar"
                 :alt="collaborator.name">
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
import { users } from '../../data/mockData'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const statusClasses = computed(() => {
  return props.project.status === 'active' 
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800'
})

const statusText = computed(() => {
  return props.project.status === 'active' ? 'Activo' : 'Borrador'
})

const owner = computed(() => users.find(u => u.id === props.project.owner_id))
const ownerAvatar = computed(() => owner.value?.avatar || '')
const ownerName = computed(() => owner.value?.name || '')

const collaboratorAvatars = computed(() => {
  return props.project.collaborators.map(id => 
    users.find(u => u.id === id)
  ).filter(Boolean)
})

const totalMembers = computed(() => 1 + props.project.collaborators.length)

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
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>