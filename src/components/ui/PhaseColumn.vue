<template>
  <div class="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col"
       :style="{ backgroundColor: phase.color + '20' }"
       @drop="handleDrop"
       @dragover.prevent
       @dragenter.prevent>
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900">{{ phase.title }}</h3>
      <div class="flex items-center space-x-2">
        <span class="bg-white text-gray-600 text-xs px-2 py-1 rounded-full">
          {{ tasksInPhase.length }}
        </span>
        <button @click="$emit('add-task')" 
                class="text-gray-500 hover:text-primary-600 transition-colors">
          <PlusIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div class="space-y-3 flex-1">
      <TaskCard
        v-for="task in tasksInPhase"
        :key="task.id"
        :task="task"
        @click="$emit('task-click', task)"
        @edit="$emit('task-edit', task)"
        @delete="$emit('task-delete', task)"
        @chat-with-lexi="$emit('chat-with-lexi', task)"
        @drag-start="$emit('task-drag-start', task)"
      />
      
      <div v-if="tasksInPhase.length === 0" 
           class="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
        <DocumentIcon class="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No hay tareas en esta fase</p>
        <p class="text-xs mt-1">Arrastra una tarea aquí o crea una nueva</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, DocumentIcon } from '@heroicons/vue/24/outline'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  phase: {
    type: Object,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'add-task', 
  'task-click', 
  'task-edit', 
  'task-delete', 
  'chat-with-lexi', 
  'task-drag-start',
  'task-drop'
])

const tasksInPhase = computed(() => 
  props.tasks.filter(task => task.phase_id === props.phase.id)
)

const handleDrop = (event) => {
  event.preventDefault()
  const taskId = event.dataTransfer.getData('text/plain')
  const taskData = JSON.parse(event.dataTransfer.getData('application/json'))
  
  if (taskData.phase_id !== props.phase.id) {
    emit('task-drop', { taskId, newPhaseId: props.phase.id })
  }
}
</script>