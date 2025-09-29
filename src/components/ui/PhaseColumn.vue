<template>
  <div class="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col" :style="{ backgroundColor: phase.color + '20' }"
    @drop="handleDrop" @dragover.prevent @dragenter.prevent>
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900">{{ phase.name }}</h3>
      <div class="flex items-center space-x-2">
        <span class="bg-white text-gray-600 text-xs px-2 py-1 rounded-full">
          {{ tasksInPhase.length }}
        </span>

        <!-- Menú de opciones -->
        <div class="relative" ref="menuRef">
          <button @click="toggleMenu" class="p-1 text-gray-500 hover:text-gray-700 transition-colors">
            <EllipsisHorizontalIcon class="w-5 h-5" />
          </button>

          <!-- Dropdown menu -->
          <div v-if="showMenu"
            class="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
            <div class="py-1">
              <button @click="addTask"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-2">
                  <PlusIcon class="w-4 h-4" />
                  <span>Agregar tarea</span>
                </div>
              </button>

              <button @click="editPhase"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-2">
                  <PencilIcon class="w-4 h-4" />
                  <span>Editar fase</span>
                </div>
              </button>

              <button @click="openAttachmentModal"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-2">
                  <DocumentIcon class="w-4 h-4" />
                  <span>Gestionar documento</span>
                  <span v-if="hasPhaseAttachment" class="ml-auto">
                    <PaperClipIcon class="w-3 h-3 text-gray-400" />
                  </span>
                </div>
              </button>

              <button @click="confirmDelete"
                class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <div class="flex items-center space-x-2">
                  <TrashIcon class="w-4 h-4" />
                  <span>Eliminar fase</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="space-y-3 flex-1">
      <TaskCard v-for="task in tasksInPhase" :key="task.id" :task="task" :has-attachment="hasTaskAttachment(task.id)"
        @click="$emit('task-click', task)" @edit="$emit('task-edit', task)" @delete="$emit('task-delete', task)"
        @drag-start="handleStartedDrag" />

      <div v-if="tasksInPhase.length === 0"
        class="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
        <DocumentIcon class="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No hay tareas en esta fase</p>
        <p class="text-xs mt-1">Arrastra una tarea aquí o crea una nueva</p>
      </div>
    </div>

    <!-- Modal de adjuntos de fase -->
    <Modal :is-open="showAttachmentModal" @close="showAttachmentModal = false" :title="`Documento de ${phase.name}`">
      <AttachmentUpload entity-type="phase" :entity-id="phase.id"
        :current-attachment="attachmentsStore.getCachedDocument('phase', phase.id)"
        @attachment-uploaded="handlePhaseAttachmentChange" @attachment-updated="handlePhaseAttachmentChange" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from 'vue'
import { DocumentIcon, EllipsisHorizontalIcon, PaperClipIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import TaskCard from './TaskCard.vue'
import Modal from './Modal.vue'
import AttachmentUpload from './AttachmentUpload.vue'
import { type TaskResponse, type PhaseResponse, type AttachmentResponse } from '../../types'
import { useAttachmentsStore } from '../../stores/attachments'


const props = defineProps({
  phase: {
    type: Object as PropType<PhaseResponse>,
    required: true
  },
  tasks: {
    type: Array as PropType<TaskResponse[]>,
    required: true,
    default: () => []
  }
})

const attachmentsStore = useAttachmentsStore()

const emit = defineEmits([
  'add-task',
  'task-click',
  'task-edit',
  'task-delete',
  'chat-with-lexi',
  'task-drag-start',
  'task-drop',
  'delete-phase'
])

const showMenu = ref(false)
const showAttachmentModal = ref(false)

const tasksInPhase = computed(() =>
  props.tasks.filter(task => task.phase_id === props.phase.id)
)

const hasTaskAttachment = (taskId: number): boolean => {
  const attachment = attachmentsStore.getCachedDocument('task', taskId)
  return attachment !== null && attachment !== undefined
}

const hasPhaseAttachment = computed(() => {
  const attachment = attachmentsStore.getCachedDocument('phase', props.phase.id)
  return attachment !== null && attachment !== undefined
})

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const addTask = () => {
  emit('add-task', props.phase.id)
  closeMenu()
}

const editPhase = () => {
  // Implementar lógica de edición
  emit('task-edit', props.phase)
  closeMenu()
}

const openAttachmentModal = () => {
  showAttachmentModal.value = true
  closeMenu()
}

const handlePhaseAttachmentChange = (attachment: AttachmentResponse) => {
  // La actualización se maneja automáticamente a través del store
  console.log('Documento de fase actualizado:', attachment)
}

const confirmDelete = () => {
  emit('delete-phase', props.phase)
  closeMenu()
}

const handleStartedDrag = (task: TaskResponse) => {
  emit('task-drag-start', task)
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const taskIdRaw = event.dataTransfer?.getData('text/plain')
  const taskData: TaskResponse = JSON.parse(event.dataTransfer?.getData('application/json') || '{}')

  const taskId = taskData.id || (taskIdRaw ? Number(taskIdRaw) : null)
  if (taskData?.phase_id !== props.phase.id) {
    emit('task-drop', { taskId: Number(taskId), newPhaseId: props.phase.id })
  }
}
</script>