<template>
  <article
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow duration-200"
    draggable="true" @dragstart="handleDragStart" @click="$emit('click')">

    <h4 class="text-sm font-medium text-gray-900 flex-1 pr-2 mb-1">{{ task.title }}</h4>

    <p v-if="task.description" class="text-gray-600 text-xs mb-3 line-clamp-2">
      {{ task.description }}
    </p>

    <footer class="flex items-center justify-between">
      <div class="flex items-center space-x-1">
        <!-- <ChatBubbleLeftIcon v-if="hasAiInteraction" class="w-4 h-4 text-secondary-500" /> -->
        <span class="text-xs text-gray-500">{{ formatDate(task.created_at) }}</span>
      </div>
    </footer>

  </article>
</template>

<script setup lang="ts">
import { type TaskResponse } from '../../types'
import { PropType } from 'vue'

const props = defineProps({
  task: {
    type: Object as PropType<TaskResponse>,
    required: true
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
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