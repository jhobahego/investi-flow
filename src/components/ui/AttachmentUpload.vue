<template>
  <div class="attachment-upload">
    <!-- Área de drag & drop -->
    <div v-if="!currentAttachment"
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
      :class="{
        'border-primary-400 bg-primary-50': isDragOver,
        'opacity-50 cursor-not-allowed': loading
      }" @drop="handleDrop" @dragover="handleDragOver" @dragenter="handleDragEnter" @dragleave="handleDragLeave">
      <input ref="fileInput" type="file" class="hidden" accept=".pdf,.docx" @change="handleFileSelect"
        :disabled="loading" />

      <div v-if="!loading" class="space-y-2">
        <DocumentPlusIcon class="w-12 h-12 mx-auto text-gray-400" />
        <div>
          <p class="text-sm text-gray-600">
            Arrastra tu documento aquí o
            <button type="button" class="text-primary-600 hover:text-primary-700 font-medium" @click="triggerFileInput">
              selecciona un archivo
            </button>
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Solo archivos PDF y DOCX, máximo 10MB
          </p>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div class="w-12 h-12 mx-auto">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
        <p class="text-sm text-gray-600">Subiendo documento...</p>
      </div>
    </div>

    <!-- Documento actual -->
    <div v-else class="border border-gray-200 rounded-lg p-4 space-y-3">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <DocumentTextIcon class="w-8 h-8" :class="getFileIcon(currentAttachment.file_type)" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ truncateFileName(currentAttachment.file_name) }}
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="getFileTypeColor(currentAttachment.file_type)">
                {{ currentAttachment.file_type.toUpperCase() }}
              </span>
              <span>•</span>
              <span>{{ formatFileSize(currentAttachment.file_size) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Botón descargar -->
          <button type="button" class="p-2 transition-colors"
            :class="isDownloading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'"
            :title="isDownloading ? 'Descargando...' : 'Descargar documento'" @click="downloadDocument"
            :disabled="isDownloading">
            <ArrowDownTrayIcon class="w-4 h-4" :class="{ 'animate-bounce': isDownloading }" />
          </button>

          <!-- Botón visualizar (sin funcionalidad por ahora) -->
          <button type="button" class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Visualizar documento (funcionalidad en desarrollo)" @click="viewDocument" disabled>
            <EyeIcon class="w-4 h-4" />
          </button>

          <!-- Botón reemplazar -->
          <button type="button" class="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Reemplazar documento (funcionalidad en desarrollo)" @click="replaceDocument" disabled>
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Metadatos adicionales -->
      <div class="text-xs text-gray-500 pt-2 border-t border-gray-100">
        Subido el {{ formatDate(currentAttachment.created_at) }}
      </div>
    </div>

    <!-- Errores -->
    <div v-if="error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </div>

    <!-- Input oculto para reemplazar archivo -->
    <input ref="replaceFileInput" type="file" class="hidden" accept=".pdf,.docx" @change="handleReplaceFileSelect"
      :disabled="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAttachmentsStore } from '../../stores/attachments'
import type { AttachmentResponse } from '../../types'
import {
  validateFile,
  formatFileSize,
  getFileIcon,
  getFileTypeColor,
  truncateFileName
} from '../../lib/attachmentUtils'
import {
  DocumentPlusIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

interface Props {
  entityType: 'project' | 'phase' | 'task'
  entityId: number
  currentAttachment?: AttachmentResponse | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'attachment-uploaded': [attachment: AttachmentResponse]
  'attachment-updated': [attachment: AttachmentResponse]
}>()

const attachmentsStore = useAttachmentsStore()

// Referencias
const fileInput = ref<HTMLInputElement>()
const replaceFileInput = ref<HTMLInputElement>()

// Estado local
const isDragOver = ref(false)
const dragCounter = ref(0)
const error = ref<string | null>(null)
const isDownloading = ref(false)

// Computed
const loading = computed(() => attachmentsStore.loading)

// Funciones
function clearError() {
  error.value = null
  attachmentsStore.clearError()
}

function triggerFileInput() {
  if (loading.value) return
  fileInput.value?.click()
}

function replaceDocument() {
  if (loading.value) return
  clearError()
  replaceFileInput.value?.click()
}

async function handleFileUpload(file: File, isReplace = false) {
  clearError()

  // Validar archivo
  const validation = validateFile(file)
  if (!validation.isValid) {
    error.value = validation.error || 'Archivo no válido'
    return
  }

  try {
    // Mostrar confirmación si es reemplazo
    if (isReplace && props.currentAttachment) {
      const confirmed = confirm(
        `¿Estás seguro de que quieres reemplazar "${props.currentAttachment.file_name}"?`
      )
      if (!confirmed) return
    }

    const uploadedAttachment = await attachmentsStore.uploadDocument(
      props.entityType,
      props.entityId,
      file
    )

    if (isReplace) {
      emit('attachment-updated', uploadedAttachment)
    } else {
      emit('attachment-uploaded', uploadedAttachment)
    }
  } catch (err: any) {
    error.value = err.message || 'Error al subir el documento'
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFileUpload(file)
  }
  // Limpiar input
  target.value = ''
}

function handleReplaceFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFileUpload(file, true)
  }
  // Limpiar input
  target.value = ''
}

// Drag & Drop handlers
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value++
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value--
  if (dragCounter.value <= 0) {
    isDragOver.value = false
    dragCounter.value = 0
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  isDragOver.value = false
  dragCounter.value = 0

  if (loading.value) return

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileUpload(files[0])
  }
}

async function downloadDocument() {
  if (!props.currentAttachment || isDownloading.value) return

  isDownloading.value = true
  clearError()

  try {
    await attachmentsStore.downloadDocument(
      props.entityType,
      props.entityId,
      props.currentAttachment.file_name
    )
  } catch (err: any) {
    error.value = err.message || 'Error al descargar el documento'
    console.error('Error downloading document:', err)
  } finally {
    isDownloading.value = false
  }
}

function viewDocument() {
  // Placeholder para futura implementación
  console.log('Visualizar documento - funcionalidad pendiente')
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar documento actual al montar
onMounted(async () => {
  if (!props.currentAttachment) {
    try {
      await attachmentsStore.getDocument(props.entityType, props.entityId)
    } catch (err) {
      // Ignorar errores 404 (no hay documento)
    }
  }
})
</script>