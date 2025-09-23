<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar />

    <!-- Loading State -->
    <div v-if="projectsStore.loading" class="max-w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-center h-64">
        <div class="text-gray-500">Cargando proyecto...</div>
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
          <button @click="handleEditTask(selectedTask)"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200">
            Guardar Cambios
          </button>
        </div>
      </template>
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
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Crear Tarea
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
import { useRoute } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useTasksStore } from '../stores/tasks'
import AppNavbar from '../components/layout/AppNavbar.vue'
import PhaseColumn from '../components/ui/PhaseColumn.vue'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { type PhaseCreate, type TaskResponse, type PhaseResponse, TaskCreate } from '../types'
import { usePhasesStore } from '../stores/phases'
import Modal from '../components/ui/Modal.vue'
import { formatDateToISO, formatISOToDate } from '../lib/dateUtils'

const route = useRoute()
const projectsStore = useProjectsStore()
const phaseStore = usePhasesStore()
const tasksStore = useTasksStore()

// Estados reactivos
const showTaskDetailModal = ref(false)
const showCreateTaskModal = ref(false)
const showCreatePhaseModal = ref(false)
const showEditPhaseModal = ref(false)
const showDeletePhaseModal = ref(false)
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

    // Recargar el proyecto para obtener las fases actualizadas
    await loadProject()

    // Resetear formulario y cerrar modal
    newPhase.value = { name: '', project_id: 0, position: 0, color: null }
    showCreatePhaseModal.value = false
  } catch (err) {
    console.error('Error creating phase:', err)
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

    // Recargar el proyecto para obtener las fases actualizadas
    await loadProject()

    // Cerrar modal
    showEditPhaseModal.value = false
  } catch (err) {
    console.error('Error updating phase:', err)
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

    // Recargar el proyecto para obtener las fases actualizadas
    await loadProject()

    // Cerrar modal y limpiar estado
    showDeletePhaseModal.value = false
    phaseToDelete.value = null
  } catch (err) {
    console.error('Error deleting phase:', err)
    // El error ya se maneja en el store, aquí podríamos mostrar una notificación
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

  const updatedTask = await tasksStore.updateTask(task.id, {
    title: task.title,
    description: task.description,
    start_date: formatDateToISO(task.start_date),
    end_date: formatDateToISO(task.end_date)
  })

  if (updatedTask.phase_id) {
    await tasksStore.getTasksByPhase(updatedTask.phase_id)
  }

  showTaskDetailModal.value = false
  selectedTask.value = null
}
const handleTaskDelete = async (task: TaskResponse) => {
  await tasksStore.deleteTask(task.id)

  if (task.phase_id) {
    await tasksStore.getTasksByPhase(task.phase_id)
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

    // Recargar las tareas de la fase correspondiente
    await tasksStore.getTasksByPhase(data.phase_id)

    // Resetear formulario y cerrar modal
    newTask.value.title = ''
    newTask.value.description = ''
    newTask.value.phase_id = 0
    newTask.value.start_date = null
    newTask.value.end_date = null

    showCreateTaskModal.value = false
  } catch (err) {
    console.error('Error creating task:', err)
  }
}

const handleMoveTaskToPhase = async ({ taskId, newPhaseId }: { taskId: number, newPhaseId: number }) => {
  const updatedTask = await tasksStore.moveTaskToPhase(taskId, newPhaseId)
  if (updatedTask) {
    // Recargar las tareas de la fase origen y destino
    if (updatedTask.phase_id) {
      await tasksStore.getTasksByPhase(updatedTask.phase_id)
    }
    await tasksStore.getTasksByPhase(newPhaseId)
  }
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
  } catch (err: any) {
    console.error('Error loading project:', err)
  }
}

onMounted(() => {
  loadProject()
})
</script>