<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow duration-200"
       draggable="true"
       @dragstart="handleDragStart"
       @click="$emit('click')">
    <div class="flex items-start justify-between mb-3">
      <h4 class="text-sm font-medium text-gray-900 flex-1 pr-2">{{ task.title }}</h4>
      <button @click.stop="showMenu = !showMenu" class="text-gray-400 hover:text-gray-600">
        <EllipsisVerticalIcon class="w-4 h-4" />
      </button>
    </div>
    
    <div v-if="task.content_blocks && task.content_blocks.length > 0" class="space-y-2 mb-3">
      <div v-for="block in task.content_blocks.slice(0, 2)" :key="block.id" class="text-xs">
        <div v-if="block.type === 'ai_suggestion'" class="bg-secondary-50 border-l-4 border-secondary-400 p-2 rounded">
          <div class="flex items-center space-x-1 mb-1">
            <LexiAvatar :show-name="false" class="scale-75" />
            <span class="text-secondary-700 font-medium">Lexi sugiere:</span>
          </div>
          <p class="text-gray-700 line-clamp-3">{{ block.content }}</p>
        </div>
        <div v-else class="text-gray-600 line-clamp-2">
          {{ block.content }}
        </div>
      </div>
      <div v-if="task.content_blocks.length > 2" class="text-xs text-gray-500">
        +{{ task.content_blocks.length - 2 }} más...
      </div>
    </div>
    
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <img class="w-5 h-5 rounded-full"
             :src="creator?.avatar"
             :alt="creator?.name">
        <span class="text-xs text-gray-500">{{ creator?.name }}</span>
      </div>
      
      <div class="flex items-center space-x-1">
        <ChatBubbleLeftIcon v-if="hasAiInteraction" class="w-4 h-4 text-secondary-500" />
        <span class="text-xs text-gray-500">{{ formatDate(task.created_at) }}</span>
      </div>
    </div>
    
    <!-- Context Menu -->
    <div v-if="showMenu" 
         class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
         @click.stop>
      <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="$emit('edit')">
        Editar
      </button>
      <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="$emit('chat-with-lexi')">
        Hablar con Lexi
      </button>
      <hr class="my-1">
      <button class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              @click="$emit('delete')">
        Eliminar
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { users } from '../../data/mockData'
import { EllipsisVerticalIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/outline'
import LexiAvatar from './LexiAvatar.vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'edit', 'delete', 'chat-with-lexi', 'drag-start'])

const showMenu = ref(false)

const creator = computed(() => users.find(u => u.id === props.task.created_by))

const hasAiInteraction = computed(() => 
  props.task.content_blocks?.some(block => block.type === 'ai_suggestion')
)

const handleDragStart = (event) => {
  event.dataTransfer.setData('text/plain', props.task.id)
  event.dataTransfer.setData('application/json', JSON.stringify(props.task))
  emit('drag-start', props.task)
}

const formatDate = (dateString) => {
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