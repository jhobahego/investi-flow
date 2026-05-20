<template>
  <div class="attachment-upload">
    <!-- Skeleton mientras carga documento existente -->
    <div v-if="loading || loadingDocument" class="border border-gray-200 rounded-lg p-4">
      <div class="animate-pulse flex items-center space-x-3">
        <div class="w-8 h-8 bg-gray-200 rounded"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Área de drag & drop -->
    <div v-else-if="!currentAttachment"
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

          <!-- Botón visualizar -->
          <button type="button" class="p-2 text-purple-600 hover:text-purple-700 transition-colors"
            title="Editar documento con IA" @click="viewDocument">
            <EyeIcon class="w-4 h-4" />
          </button>

          <!-- Botón reemplazar -->
          <button type="button" class="p-2 transition-colors"
            :class="loading ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'"
            :title="loading ? 'Cargando...' : 'Reemplazar documento'" @click="replaceDocument" :disabled="loading">
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
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

    <!-- Modal de confirmación personalizado para reemplazar documento -->
    <Teleport to="body">
      <Modal :is-open="showConfirmModal" @close="cancelReplacement" title="Confirmar Reemplazo" size="sm">
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 bg-orange-100 p-2 rounded-full">
              <ExclamationTriangleIcon class="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">
                ¿Reemplazar documento existente?
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Estás a punto de reemplazar <span class="font-medium text-gray-700">"{{ currentAttachment?.file_name }}"</span> con <span class="font-medium text-gray-700">"{{ pendingFile?.name }}"</span>.
              </p>
            </div>
          </div>
          <p class="text-xs text-gray-500">
            Esta acción actualizará el archivo actual y mantendrá la vinculación y el historial correspondientes.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3 w-full">
            <button type="button" @click="cancelReplacement"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
              Cancelar
            </button>
            <button type="button" @click="confirmReplacement" :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-600">
              {{ loading ? 'Reemplazando...' : 'Reemplazar' }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../../stores/projects'
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
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import Modal from './Modal.vue'

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

const router = useRouter()
const projectsStore = useProjectsStore()
const attachmentsStore = useAttachmentsStore()

// Referencias
const fileInput = ref<HTMLInputElement>()
const replaceFileInput = ref<HTMLInputElement>()

// Estado local
const isDragOver = ref(false)
const dragCounter = ref(0)
const error = ref<string | null>(null)
const isDownloading = ref(false)
const loadingDocument = ref(false)
const showConfirmModal = ref(false)
const pendingFile = ref<File | null>(null)

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

function cancelReplacement() {
  pendingFile.value = null
  showConfirmModal.value = false
}

async function confirmReplacement() {
  if (!pendingFile.value) return
  
  const file = pendingFile.value
  pendingFile.value = null
  showConfirmModal.value = false
  
  clearError()
  
  try {
    const uploadedAttachment = await attachmentsStore.replaceDocument(
      props.entityType,
      props.entityId,
      file
    )
    emit('attachment-updated', uploadedAttachment)
  } catch (err: any) {
    error.value = err.message || 'Error al reemplazar el documento'
  }
}

async function handleFileUpload(file: File) {
  clearError()

  // Validar archivo
  const validation = validateFile(file)
  if (!validation.isValid) {
    error.value = validation.error || 'Archivo no válido'
    return
  }

  try {
    const uploadedAttachment = await attachmentsStore.uploadDocument(
      props.entityType,
      props.entityId,
      file
    )
    emit('attachment-uploaded', uploadedAttachment)
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
    // Validar archivo primero
    const validation = validateFile(file)
    if (!validation.isValid) {
      error.value = validation.error || 'Archivo no válido'
      target.value = ''
      return
    }

    pendingFile.value = file
    showConfirmModal.value = true
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
  if (!props.currentAttachment) return

  // Navegar a la vista del editor
  router.push({
    name: 'DocumentEditor',
    params: {
      id: getProjectId()
    },
    query: {
      entityType: props.entityType,
      entityId: props.entityId.toString()
    }
  })
}

function getProjectId(): number {
  // Si entityType es 'project', usar entityId directamente
  if (props.entityType === 'project') {
    return props.entityId
  }

  // Si es phase o task, obtener el projectId del store actual
  const currentProject = projectsStore.currentProject
  if (currentProject?.id) {
    return currentProject.id
  }

  // Fallback: intentar obtener del currentProjectId del store
  return projectsStore.currentProjectId || props.entityId
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
    loadingDocument.value = true
    try {
      await attachmentsStore.getDocument(props.entityType, props.entityId)
    } catch (err) {
      // Ignorar errores 404 (no hay documento)
    } finally {
      loadingDocument.value = false
    }
  }
})
</script>