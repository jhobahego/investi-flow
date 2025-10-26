<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar />

    <!-- Loading State -->
    <div v-if="projectsStore.loading" class="max-w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="mb-6">
        <div class="animate-pulse flex items-center space-x-4">
          <div class="h-8 w-8 bg-gray-200 rounded"></div>
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      <div class="flex space-x-6 overflow-x-auto pb-6">
        <SkeletonLoader type="phase-column" :count="3" />
      </div>
    </div>

    <!-- Error State project -->
    <div v-else-if="projectsStore.error" class="max-w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-center h-64">
        <div class="text-red-500">Error: {{ projectsStore.error }}</div>
      </div>
    </div>

    <!-- Error state phase -->
    <div v-else-if="phaseStore.error" class="max-w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-center h-64">
        <div class="text-red-500">Error: {{ phaseStore.error }}</div>
      </div>
    </div>

    <!-- Project Content -->
    <div class="max-w-full px-4 sm:px-6 lg:px-8 py-6" v-else-if="projectsStore.currentProject">
      <!-- Project Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button @click="$router.go(-1)" class="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeftIcon class="w-5 h-5" />
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ projectsStore.currentProject.name }}</h1>
              <p class="text-gray-600">{{ projectsStore.currentProject.description }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <button class="text-gray-500 hover:text-gray-700 transition-colors">
              <UserPlusIcon class="w-5 h-5" />
            </button>
            <button @click="navigateToChat"
              class="px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z">
                </path>
              </svg>
              <span>Chat con Lexi</span>
            </button>
            <button @click="showProjectAttachmentModal = true"
              class="px-4 py-2 rounded-md transition-colors flex items-center space-x-2" :class="projectDocument
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              :title="projectDocument ? 'Ver documento principal' : 'Adjuntar documento principal'">
              <DocumentTextIcon class="w-4 h-4" />
              <span v-if="projectDocument">Documento</span>
              <span v-else>Adjuntar</span>
              <PaperClipIcon v-if="projectDocument" class="w-3 h-3" />
            </button>
            <button @click="showCreatePhaseModal = true"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              Crear Fase
            </button>
          </div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div v-if="projectsStore.currentProject.phases && projectsStore.currentProject.phases.length > 0"
        class="flex space-x-6 overflow-x-auto pb-6">
        <div class="flex-shrink-0 w-80" v-for="phase in projectsStore.currentProject.phases" :key="phase.id">
          <PhaseColumn :phase="phase" :tasks="currentTasks" @add-task="handleCreateTask" @task-click="handleTaskClick"
            @task-edit="handleEditPhase" @task-delete="handleTaskDelete" @delete-phase="handleDeletePhase"
            @chat-with-lexi="() => { }" @task-drag-start="() => { }" @task-drop="handleMoveTaskToPhase" />
        </div>
      </div>

      <!-- Empty State - No Phases -->
      <div v-else class="flex flex-col items-center justify-center py-16 px-4">
        <div class="text-center max-w-md">
          <!-- Icon -->
          <div class="mx-auto flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
              </path>
            </svg>
          </div>

          <!-- Title and description -->
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            No tienes fases creadas
          </h3>
          <p class="text-gray-500 mb-8">
            Las fases te ayudan a organizar tu proyecto en etapas claras. Crea tu primera fase para comenzar.
          </p>

          <!-- Create phase button -->
          <button @click="showCreatePhaseModal = true"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-sm">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6">
              </path>
            </svg>
            Crear Primera Fase
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear fase -->
    <Modal :is-open="showCreatePhaseModal" @close="showCreatePhaseModal = false" title="Crear Nueva Fase">
      <form @submit.prevent="handleCreatePhase" class="space-y-4">
        <div>
          <label for="phaseTitle" class="block text-sm font-medium text-gray-700 mb-1">
            Título de la fase
          </label>
          <input id="phaseTitle" type="text" required v-model="newPhase.name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué vas a trabajar?" />
        </div>
        <div>
          <label for="phaseColor" class="block text-sm font-medium text-gray-700 mb-1">
            Color de la fase (opcional)
          </label>
          <input id="phaseColor" type="color" v-model="newPhase.color"
            class="w-16 h-10 p-0 border-0 rounded-md cursor-pointer" title="Elige un color para la fase" />
        </div>

        <div>
          <label for="phasePosition" class="block text-sm font-medium text-gray-700 mb-1">
            Posición de la fase
          </label>
          <input id="phasePosition" type="number" v-model="newPhase.position"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué orden debe aparecer esta fase?" />
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end space-x-1">
          <button type="button" @click="showCreatePhaseModal = false"
            class="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
            Cancelar
          </button>
          <button @click="handleCreatePhase" :disabled="phaseStore.loading"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ phaseStore.loading ? 'Creando...' : 'Crear Fase' }}
          </button>
        </div>
      </template>
    </Modal>
    <!-- Modal para Editar una fase -->
    <Modal :is-open="showEditPhaseModal" @close="showEditPhaseModal = false" title="Editar Fase">
      <form @submit.prevent="updatePhase" class="space-y-4">
        <div>
          <label for="editPhaseTitle" class="block text-sm font-medium text-gray-700 mb-1">
            Título de la fase
          </label>
          <input id="editPhaseTitle" type="text" required v-model="editPhase.name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué vas a trabajar?" />
        </div>
        <div>
          <label for="editPhasePosition" class="block text-sm font-medium text-gray-700 mb-1">
            Posición de la fase
          </label>
          <input id="editPhasePosition" type="number" v-model="editPhase.position"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué orden debe aparecer esta fase?" />
        </div>
        <div>
          <label for="editPhaseColor" class="block text-sm font-medium text-gray-700 mb-1">
            Color de la fase (opcional)
          </label>
          <input id="editPhaseColor" type="color" v-model="editPhase.color"
            class="w-16 h-10 p-0 border-0 rounded-md cursor-pointer" title="Elige un color para la fase" />
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end space-x-1">
          <button type="button" @click="showEditPhaseModal = false"
            class="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
            Cancelar
          </button>
          <button type="submit" @click="updatePhase" :disabled="phaseStore.loading"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ phaseStore.loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Modal de confirmación para eliminar fase -->
    <Modal :is-open="showDeletePhaseModal" @close="cancelDeletePhase" title="Eliminar Fase" size="md">
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-900">
              ¿Estás seguro de que quieres eliminar la fase
              <span class="font-semibold">"{{ phaseToDelete?.name }}"</span>?
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Esta acción no se puede deshacer. Todas las tareas asociadas a esta fase también serán eliminadas.
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button type="button" @click="cancelDeletePhase"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
            Cancelar
          </button>
          <button @click="confirmDeletePhase" :disabled="phaseStore.loading"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ phaseStore.loading ? 'Eliminando...' : 'Eliminar Fase' }}
          </button>
        </div>
      </template>
    </Modal>
    <!-- Modal para ver/editar tarea -->
    <Modal :is-open="showTaskDetailModal" @close="showTaskDetailModal = false" title="Detalles de la Tarea" size="xl">

      <div v-if="selectedTask" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Título de la tarea
          </label>
          <input v-model="selectedTask.title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea v-model="selectedTask.description" rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de inicio
          </label>
          <input v-model="selectedTask.start_date" type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500" />

          <label class="block text-sm font-medium text-gray-700 mb-2 mt-4">
            Fecha de fin
          </label>
          <input v-model="selectedTask.end_date" type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <!-- Sección de Adjuntos -->
        <div class="border-t border-gray-200 pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Documento de la Tarea
          </label>
          <AttachmentUpload v-if="selectedTask" entity-type="task" :entity-id="selectedTask.id"
            :current-attachment="getTaskDocument(selectedTask.id)" @attachment-uploaded="handleTaskDocumentUploaded"
            @attachment-updated="handleTaskDocumentUpdated" />
        </div>
      </div>

      <!-- <div> <label class="block text-sm font-medium text-gray-700 mb-2">
            Contenido
          </label>
        <!-- <div class="space-y-4">
            <div v-for="block in selectedTask.content_blocks" :key="block.id" class="border rounded-lg p-4"
              :class="block.type === 'ai_suggestion' ? 'bg-secondary-50 border-secondary-200' : 'bg-white border-gray-200'">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <LexiAvatar v-if="block.type === 'ai_suggestion'" :show-name="false" class="scale-75" />
                  <UserIcon v-else class="w-5 h-5 text-gray-500" />
                  <span class="text-sm font-medium text-gray-700">
                    {{ block.type === 'ai_suggestion' ? 'Lexi' : 'Usuario' }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ formatDate(block.created_at) }}
                  </span>
                </div>
              </div>
              <div class="text-gray-700">{{ block.content }}</div>
            </div>

            <div class="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <textarea v-model="newContent" placeholder="Agrega una nota o comentario..." rows="3"
                class="w-full border-0 focus:ring-0 resize-none"></textarea>
              <div class="flex items-center justify-between mt-3">
                <button @click="addUserContent" :disabled="!newContent.trim()"
                  class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Agregar Nota
                </button>
                <button @click="askLexiForHelp"
                  class="px-4 py-2 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-md transition-colors flex items-center space-x-2">
                  <LexiAvatar :show-name="false" class="scale-75" />
                  <span>Pedir ayuda a Lexi</span>
                </button>
              </div>
            </div>
          </div> -->
      <!-- </div> -->

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button type="button" @click="showTaskDetailModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
            Cerrar
          </button>
          <button @click="handleEditTask(selectedTask)" :disabled="tasksStore.loading"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]">
            <span v-if="!tasksStore.loading">Guardar Cambios</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              Guardando...
            </span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Modal de Adjuntos del Proyecto -->
    <Modal :is-open="showProjectAttachmentModal" @close="showProjectAttachmentModal = false"
      title="Documento Principal del Proyecto">
      <AttachmentUpload v-if="projectsStore.currentProject" entity-type="project"
        :entity-id="projectsStore.currentProject.id" :current-attachment="projectDocument"
        @attachment-uploaded="handleProjectDocumentUploaded" @attachment-updated="handleProjectDocumentUpdated" />
    </Modal>

    <!-- Create Task Modal -->
    <Modal :is-open="showCreateTaskModal" @close="showCreateTaskModal = false" title="Crear Nueva Tarea">
      <form @submit.prevent="createTask" class="space-y-4">
        <div>
          <label for="taskTitle" class="block text-sm font-medium text-gray-700 mb-1">
            Título de la tarea
          </label>
          <input id="taskTitle" type="text" required v-model="newTask.title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué vas a trabajar?" />
        </div>
        <div>
          <label for="taskDescription" class="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea id="taskDescription" rows="3" v-model="newTask.description"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Detalles adicionales sobre la tarea..."></textarea>
        </div>
        <!-- <div>
          <label for="taskPosition" class="block text-sm font-medium text-gray-700 mb-1">
            Posición (opcional)
          </label>
          <input id="taskPosition" type="number" v-model="newTask.position"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué orden debe aparecer esta tarea?" />
        </div> -->
        <div>
          <label for="taskStartDate" class="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inicio (opcional)
          </label>
          <input id="taskStartDate" type="date" v-model="newTask.start_date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <div>
          <label for="taskEndDate" class="block text-sm font-medium text-gray-700 mb-1">
            Fecha de fin (opcional)
          </label>
          <input id="taskEndDate" type="date" v-model="newTask.end_date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>
      </form>

      <template #footer>
        <button type="button" @click="showCreateTaskModal = false"
          class="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
          Cancelar
        </button>
        <button type="submit" @click="createTask" :disabled="tasksStore.loading"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]">
          <span v-if="!tasksStore.loading">Crear Tarea</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Creando...
          </span>
        </button>
      </template>

      <!-- Errores -->
      <div v-if="tasksStore.error" class="text-sm text-red-600">
        {{ tasksStore.error }}
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useTasksStore } from '../stores/tasks'
import { useAttachmentsStore } from '../stores/attachments'
import { useToast } from '../composables/useToast'
import AppNavbar from '../components/layout/AppNavbar.vue'
import PhaseColumn from '../components/ui/PhaseColumn.vue'
import AttachmentUpload from '../components/ui/AttachmentUpload.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PaperClipIcon
} from '@heroicons/vue/24/outline'
import { type PhaseCreate, type TaskResponse, type PhaseResponse, TaskCreate, type AttachmentResponse } from '../types'
import { usePhasesStore } from '../stores/phases'
import Modal from '../components/ui/Modal.vue'
import { formatDateToISO, formatISOToDate } from '../lib/dateUtils'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const phaseStore = usePhasesStore()
const tasksStore = useTasksStore()
const attachmentsStore = useAttachmentsStore()
const { showSuccess, showError } = useToast()

// Estados reactivos
const showTaskDetailModal = ref(false)
const showCreateTaskModal = ref(false)
const showCreatePhaseModal = ref(false)
const showEditPhaseModal = ref(false)
const showDeletePhaseModal = ref(false)
const showProjectAttachmentModal = ref(false)
const selectedTask = ref<TaskResponse | null>(null)
const phaseToDelete = ref<PhaseResponse | null>(null)

const newPhase = ref<PhaseCreate>({
  name: '',
  project_id: 0,
  position: 0,
  color: null
})

const editPhase = ref<Partial<PhaseResponse>>({
  name: '',
  position: 0,
  color: null
})

// Estado para adjuntos
const projectDocument = ref<AttachmentResponse | null>(null)

// Obtener todas las tareas del proyecto actual
const currentTasks = computed(() => tasksStore.tasks)

const handleCreatePhase = async () => {
  if (!newPhase.value.name.trim()) return
  if (!projectsStore.currentProject) {
    console.error('No current project selected')
    return
  }

  newPhase.value.project_id = projectsStore.currentProject.id

  try {
    await phaseStore.createPhase(newPhase.value)

    // Cerrar modal inmediatamente
    newPhase.value = { name: '', project_id: 0, position: 0, color: null }
    showCreatePhaseModal.value = false

    // Mostrar notificación de éxito
    showSuccess('Fase creada exitosamente')

    // Recargar proyecto en segundo plano
    await loadProject()
  } catch (err) {
    console.error('Error creating phase:', err)
    showError('Error al crear la fase. Intenta nuevamente.')
  }
}

const handleEditPhase = (phase: PhaseResponse) => {
  editPhase.value = { ...phase }
  showEditPhaseModal.value = true
}
const updatePhase = async () => {
  const { id, name, position, color } = editPhase.value
  if (!editPhase.value) return
  if (!editPhase.value.name?.trim()) return
  if (id === undefined) return

  try {
    await phaseStore.updatePhase(id, {
      name,
      position,
      color
    })

    // Cerrar modal inmediatamente
    showEditPhaseModal.value = false

    // Mostrar notificación de éxito
    showSuccess('Fase actualizada exitosamente')

    // Recargar proyecto en segundo plano
    await loadProject()
  } catch (err) {
    console.error('Error updating phase:', err)
    showError('Error al actualizar la fase. Intenta nuevamente.')
  }
}

const handleDeletePhase = (phase: PhaseResponse) => {
  phaseToDelete.value = phase
  showDeletePhaseModal.value = true
}

const confirmDeletePhase = async () => {
  if (!phaseToDelete.value) return

  try {
    await phaseStore.deletePhase(phaseToDelete.value.id)

    // Cerrar modal inmediatamente
    showDeletePhaseModal.value = false
    phaseToDelete.value = null

    // Mostrar notificación de éxito
    showSuccess('Fase eliminada exitosamente')

    // Recargar proyecto en segundo plano
    await loadProject()
  } catch (err) {
    console.error('Error deleting phase:', err)
    showError('Error al eliminar la fase. Intenta nuevamente.')
  }
}

const cancelDeletePhase = () => {
  showDeletePhaseModal.value = false
  phaseToDelete.value = null
}

const newTask = ref<Partial<TaskResponse>>({
  title: '',
  description: '',
  position: 0,
  start_date: null,
  end_date: null,
  phase_id: 0,
})

const handleCreateTask = (phaseId: number) => {
  newTask.value.phase_id = phaseId
  showCreateTaskModal.value = true
}
const handleTaskClick = (task: TaskResponse) => {
  // Crear una copia de la tarea con fechas formateadas para los inputs tipo date
  selectedTask.value = {
    ...task,
    start_date: formatISOToDate(task.start_date),
    end_date: formatISOToDate(task.end_date)
  }
  showTaskDetailModal.value = true
}
const handleEditTask = async (task: TaskResponse | null) => {
  if (!task) return

  try {
    const updatedTask = await tasksStore.updateTask(task.id, {
      title: task.title,
      description: task.description,
      start_date: formatDateToISO(task.start_date),
      end_date: formatDateToISO(task.end_date)
    })

    // Cerrar modal inmediatamente
    showTaskDetailModal.value = false
    selectedTask.value = null

    // Mostrar notificación de éxito
    showSuccess('Tarea actualizada exitosamente')

    // Recargar tareas en segundo plano
    if (updatedTask.phase_id) {
      await tasksStore.getTasksByPhase(updatedTask.phase_id)
    }
  } catch (err) {
    console.error('Error updating task:', err)
    showError('Error al actualizar la tarea. Intenta nuevamente.')
  }
}
const handleTaskDelete = async (task: TaskResponse) => {
  try {
    await tasksStore.deleteTask(task.id)

    // Mostrar notificación de éxito
    showSuccess('Tarea eliminada exitosamente')

    // Recargar tareas en segundo plano
    if (task.phase_id) {
      await tasksStore.getTasksByPhase(task.phase_id)
    }
  } catch (err) {
    console.error('Error deleting task:', err)
    showError('Error al eliminar la tarea. Intenta nuevamente.')
  }
}
const createTask = async () => {
  const { title, description, position, phase_id, start_date, end_date } = newTask.value

  if (title == undefined) return
  if (phase_id === undefined) return

  const taskData: TaskCreate = {
    title,
    description,
    position,
    phase_id,
    start_date: formatDateToISO(start_date || null),
    end_date: formatDateToISO(end_date || null)
  }

  try {
    const data = await tasksStore.createTask(taskData)

    // Cerrar modal inmediatamente
    newTask.value.title = ''
    newTask.value.description = ''
    newTask.value.phase_id = 0
    newTask.value.start_date = null
    newTask.value.end_date = null
    showCreateTaskModal.value = false

    // Mostrar notificación de éxito
    showSuccess('Tarea creada exitosamente')

    // Recargar tareas en segundo plano
    await tasksStore.getTasksByPhase(data.phase_id)
  } catch (err) {
    console.error('Error creating task:', err)
    showError('Error al crear la tarea. Intenta nuevamente.')
  }
}

const handleMoveTaskToPhase = async ({ taskId, newPhaseId }: { taskId: number, newPhaseId: number }) => {
  try {
    const updatedTask = await tasksStore.moveTaskToPhase(taskId, newPhaseId)
    if (updatedTask) {
      if (updatedTask.phase_id) {
        await tasksStore.getTasksByPhase(updatedTask.phase_id)
      }
      await tasksStore.getTasksByPhase(newPhaseId)
      showSuccess('Tarea movida exitosamente')
    }
  } catch (err) {
    console.error('Error moving task:', err)
    showError('Error al mover la tarea. Intenta nuevamente.')
  }
}

// Funciones para adjuntos
const handleProjectDocumentUploaded = (attachment: AttachmentResponse) => {
  projectDocument.value = attachment
}

const handleProjectDocumentUpdated = (attachment: AttachmentResponse) => {
  projectDocument.value = attachment
}

const handleTaskDocumentUploaded = (attachment: AttachmentResponse) => {
  // La tarea se actualiza automáticamente a través del store
  console.log('Documento de tarea subido:', attachment)
}

const handleTaskDocumentUpdated = (attachment: AttachmentResponse) => {
  // La tarea se actualiza automáticamente a través del store
  console.log('Documento de tarea actualizado:', attachment)
}

const getTaskDocument = (taskId: number): AttachmentResponse | null => {
  return attachmentsStore.getCachedDocument('task', taskId) || null
}

const navigateToChat = () => {
  router.push(`/project/${route.params.id}/chat`)
}

// Función para cargar el proyecto
const loadProject = async () => {
  try {
    const project_id = route.params.id
    if (!project_id) {
      throw new Error('Project ID is required in route params')
    }

    // Cargar proyecto con fases
    const data = await projectsStore.fetchProjectWithPhases(Number(project_id))
    if (!data) {
      throw new Error('Project not found')
    }

    // Cargar tareas de cada fase
    if (data.phases && data.phases.length > 0) {
      for (const phase of data.phases) {
        await tasksStore.getTasksByPhase(phase.id)
      }
    }

    // Cargar documento del proyecto
    try {
      projectDocument.value = await attachmentsStore.getDocument('project', data.id)
    } catch (err) {
      // Ignorar error si no hay documento (404)
      console.log('No document found for project:', data.id)
    }
  } catch (err: any) {
    console.error('Error loading project:', err)
  }
}

onMounted(() => {
  loadProject()
})
</script>