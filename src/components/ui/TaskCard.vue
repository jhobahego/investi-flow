<template>
  <article
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow duration-200"
    :class="{
      'opacity-75 bg-gray-50': task.completed,
      'border-green-200 bg-green-50': task.completed
    }" draggable="true" @dragstart="handleDragStart" @click="$emit('click')">

    <div class="flex items-start justify-between mb-1">
      <h4 class="text-sm font-medium text-gray-900 flex-1 pr-2"
        :class="{ 'line-through text-gray-500': task.completed }">
        {{ task.title }}
      </h4>

      <div class="flex-shrink-0 flex items-center space-x-1">
        <!-- Icono de adjunto -->
        <div v-if="hasAttachment" class="text-gray-400" title="Tiene documento adjunto">
          <PaperClipIcon class="w-4 h-4" />
        </div>

        <!-- Indicador de tarea completada -->
        <div v-if="task.completed">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd" />
            </svg>
            Completada
          </span>
        </div>
      </div>
    </div>

    <p v-if="task.description" class="text-gray-600 text-xs mb-3 line-clamp-2"
      :class="{ 'text-gray-400': task.completed }">
      {{ task.description }}
    </p>

    <footer class="flex items-center justify-between mt-2">
      <div class="flex flex-col space-y-1">
        <div v-if="task.start_date || task.end_date" class="flex flex-wrap gap-2 text-xs">
          <span v-if="task.start_date"
            class="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full"
            :class="{ 'opacity-60': task.completed }">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
            Inicio: {{ formatTaskDate(task.start_date) }}
          </span>
          <span v-if="task.end_date" class="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded-full"
            :class="{ 'opacity-60': task.completed }">
            <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
            Fin: {{ formatTaskDate(task.end_date) }}
          </span>
        </div>
        <span v-else class="text-xs text-gray-400 italic">Sin fechas programadas</span>

        <!-- Mostrar fecha de completado si está disponible -->
        <div v-if="task.completed" class="text-xs text-green-600 font-medium flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
          Completada
        </div>
      </div>
    </footer>

  </article>
</template>

<script setup lang="ts">
import { type TaskResponse } from '../../types'
import { PropType } from 'vue'
import { PaperClipIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  task: {
    type: Object as PropType<TaskResponse>,
    required: true
  },
  hasAttachment: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'edit', 'delete', 'chat-with-lexi', 'drag-start'])

// const hasAiInteraction = computed(() => 
//   props.task.content_blocks?.some(block => block.type === 'ai_suggestion')
// )

const handleDragStart = (event: DragEvent) => {
  event.dataTransfer?.setData('text/plain', props.task.id.toString())
  event.dataTransfer?.setData('application/json', JSON.stringify(props.task))
  emit('drag-start', props.task)
}

const formatTaskDate = (dateString: string | null) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Calcular diferencia en días
    const diffTime = taskDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Formatear según la proximidad - pero manteniendo formato descriptivo
    if (diffDays === 0) {
      return 'hoy'
    } else if (diffDays === 1) {
      return 'mañana'
    } else if (diffDays === -1) {
      return 'ayer'
    } else {
      // Usar formato "22 sept" para todas las demás fechas
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  } catch (error) {
    console.error('Error formatting task date:', error)
    return dateString
  }
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