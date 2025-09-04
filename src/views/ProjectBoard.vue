<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar />
    
    <div class="max-w-full px-4 sm:px-6 lg:px-8 py-6" v-if="currentProject">
      <!-- Project Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.go(-1)"
              class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon class="w-5 h-5" />
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ currentProject.name }}</h1>
              <p class="text-gray-600">{{ currentProject.description }}</p>
            </div>
          </div>
          
          <!-- <div class="flex items-center space-x-4">
            <div class="flex -space-x-2">
              <img 
                :src="ownerAvatar"
                :alt="ownerName"
                class="w-8 h-8 rounded-full border-2 border-white"
                :title="ownerName"
              >
              <img 
                v-for="collaborator in collaboratorAvatars" 
                :key="collaborator.id"
                :src="collaborator.avatar"
                :alt="collaborator.name"
                :title="collaborator.name"
                class="w-8 h-8 rounded-full border-2 border-white"
              >
            </div> -->
            <button class="text-gray-500 hover:text-gray-700 transition-colors">
              <UserPlusIcon class="w-5 h-5" />
            </button>
          <!-- </div> -->
        </div>
      </div>
      
      <!-- Kanban Board -->
      <div class="flex space-x-6 overflow-x-auto pb-6">
        <div class="flex-shrink-0 w-80" v-for="phase in currentProject.phases" :key="phase.id">
          <PhaseColumn
            :phase="phase"
            :tasks="currentTasks || []"
            @add-task="handleAddTask(phase.id)"
            @task-click="handleTaskClick"
            @task-edit="handleTaskEdit"
            @task-delete="handleTaskDelete"
            @chat-with-lexi="handleChatWithLexi"
            @task-drop="handleTaskDrop"
          />
        </div>
      </div>
    </div>
    
    <!-- Task Detail Modal -->
    <Modal
      :is-open="showTaskModal"
      @close="showTaskModal = false"
      title="Detalles de la Tarea"
      size="xl"
    >
      <div v-if="selectedTask" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Título de la tarea
          </label>
          <input
            v-model="selectedTask.title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Contenido
          </label>
          <div class="space-y-4">
            <div
              v-for="block in selectedTask.content_blocks"
              :key="block.id"
              class="border rounded-lg p-4"
              :class="block.type === 'ai_suggestion' ? 'bg-secondary-50 border-secondary-200' : 'bg-white border-gray-200'"
            >
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
              <textarea
                v-model="newContent"
                placeholder="Agrega una nota o comentario..."
                rows="3"
                class="w-full border-0 focus:ring-0 resize-none"
              ></textarea>
              <div class="flex items-center justify-between mt-3">
                <button
                  @click="addUserContent"
                  :disabled="!newContent.trim()"
                  class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Agregar Nota
                </button>
                <button
                  @click="askLexiForHelp"
                  class="px-4 py-2 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-md transition-colors flex items-center space-x-2"
                >
                  <LexiAvatar :show-name="false" class="scale-75" />
                  <span>Pedir ayuda a Lexi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
    
    <!-- Create Task Modal -->
    <Modal
      :is-open="showCreateTaskModal"
      @close="showCreateTaskModal = false"
      title="Crear Nueva Tarea"
    >
      <form @submit.prevent="handleCreateTask" class="space-y-4">
        <div>
          <label for="taskTitle" class="block text-sm font-medium text-gray-700 mb-1">
            Título de la tarea
          </label>
          <input
            id="taskTitle"
            type="text"
            required
            v-model="newTask.title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="¿En qué vas a trabajar?"
          />
        </div>
      </form>
      
      <template #footer>
        <button
          type="button"
          @click="showCreateTaskModal = false"
          class="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          @click="handleCreateTask"
          :disabled="!newTask.title"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Crear Tarea
        </button>
      </template>
    </Modal>
    
    <!-- Lexi Chat Modal -->
    <Modal
      :is-open="showLexiModal"
      @close="showLexiModal = false"
      title="Conversación con Lexi"
      size="lg"
    >
      <div v-if="selectedTask" class="space-y-4">
        <div class="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
          <div class="flex items-center space-x-2 mb-2">
            <LexiAvatar :show-name="false" />
            <span class="font-medium text-secondary-700">Lexi</span>
          </div>
          <p class="text-gray-700">
            ¡Hola! Estoy aquí para ayudarte con "{{ selectedTask.title }}". 
            ¿En qué específicamente te gustaría que te asista?
          </p>
        </div>
        
        <div class="max-h-64 overflow-y-auto space-y-3">
          <!-- Show existing AI suggestions -->
          <div
            v-for="block in selectedTask.content_blocks?.filter(b => b.type === 'ai_suggestion')"
            :key="block.id"
            class="bg-secondary-50 p-3 rounded-lg"
          >
            <div class="flex items-center space-x-2 mb-1">
              <LexiAvatar :show-name="false" class="scale-75" />
              <span class="text-sm font-medium text-secondary-700">Lexi</span>
              <span class="text-xs text-gray-500">{{ formatDate(block.created_at) }}</span>
            </div>
            <p class="text-sm text-gray-700">{{ block.content }}</p>
          </div>
        </div>
        
        <div>
          <textarea
            v-model="lexiQuestion"
            placeholder="Escribe tu pregunta para Lexi..."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          ></textarea>
          <button
            @click="sendQuestionToLexi"
            :disabled="!lexiQuestion.trim()"
            class="mt-2 px-4 py-2 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enviar pregunta
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'
import { users, aiSuggestions } from '../data/mockData'
import AppNavbar from '../components/layout/AppNavbar.vue'
import PhaseColumn from '../components/ui/PhaseColumn.vue'
import Modal from '../components/ui/Modal.vue'
import LexiAvatar from '../components/ui/LexiAvatar.vue'
import { 
  ArrowLeftIcon, 
  UserPlusIcon, 
  UserIcon 
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()

const showTaskModal = ref(false)
const showCreateTaskModal = ref(false)
const showLexiModal = ref(false)
const selectedTask = ref(null)
const newContent = ref('')
const lexiQuestion = ref('')
const newTaskPhaseId = ref('')

const newTask = reactive({
  title: ''
})

const user = computed(() => authStore.user)
const currentProject = computed(() => projectsStore.currentProject)
const currentTasks = computed(() => projectsStore.currentTasks)

const owner = computed(() => 
  currentProject.value ? users.find(u => u.id === currentProject.value.owner_id) : null
)
const ownerAvatar = computed(() => owner.value?.avatar || '')
const ownerName = computed(() => owner.value?.name || '')

const collaboratorAvatars = computed(() => {
  if (!currentProject.value) return []
  return currentProject.value?.collaborators?.map(id => 
    users.find(u => u.id === id)
  )?.filter(Boolean)
})

const handleTaskClick = (task) => {
  selectedTask.value = { ...task }
  showTaskModal.value = true
}

const handleTaskEdit = (task) => {
  handleTaskClick(task)
}

const handleTaskDelete = (task) => {
  // In real app, this would call an API
  const index = currentTasks.value.findIndex(t => t.id === task.id)
  if (index > -1) {
    currentTasks.value.splice(index, 1)
  }
}

const handleChatWithLexi = (task) => {
  selectedTask.value = task
  showLexiModal.value = true
}

const handleAddTask = (phaseId) => {
  newTaskPhaseId.value = phaseId
  showCreateTaskModal.value = true
}

const handleCreateTask = () => {
  if (!newTask.title) return
  
  const taskData = {
    project_id: route.params.id,
    phase_id: newTaskPhaseId.value,
    title: newTask.title,
    created_by: user.value.id
  }
  
  projectsStore.addTask(taskData)
  
  // Reset form and close modal
  newTask.title = ''
  showCreateTaskModal.value = false
}

const handleTaskDrop = ({ taskId, newPhaseId }) => {
  projectsStore.updateTaskPhase(taskId, newPhaseId)
}

const addUserContent = () => {
  if (!newContent.value.trim() || !selectedTask.value) return
  
  const contentBlock = {
    type: 'user_text',
    content: newContent.value.trim()
  }
  
  projectsStore.addContentBlock(selectedTask.value.id, contentBlock)
  selectedTask.value.content_blocks.push({
    ...contentBlock,
    id: Date.now().toString(),
    created_at: new Date().toISOString()
  })
  
  newContent.value = ''
}

const askLexiForHelp = () => {
  if (!selectedTask.value) return
  
  // Simulate AI response based on task context
  const responses = [
    "Para definir mejor el alcance de tu investigación, te sugiero considerar: 1) Delimitación temporal, 2) Delimitación geográfica, 3) Población específica de estudio. Esto hará tu investigación más manejable y enfocada.",
    "Un buen planteamiento del problema debe incluir: la situación actual, las consecuencias del problema, y una pregunta de investigación clara. ¿Te gustaría que te ayude a estructurar alguno de estos elementos?",
    "Para el marco teórico, te recomiendo buscar fuentes recientes (últimos 5 años) en bases de datos académicas. Organiza las teorías de lo general a lo específico, y siempre relaciona con tu problema de investigación."
  ]
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  
  const aiSuggestion = {
    type: 'ai_suggestion',
    content: randomResponse,
    ai_context: 'general_help'
  }
  
  projectsStore.addContentBlock(selectedTask.value.id, aiSuggestion)
  selectedTask.value.content_blocks.push({
    ...aiSuggestion,
    id: Date.now().toString(),
    created_at: new Date().toISOString()
  })
}

const sendQuestionToLexi = () => {
  if (!lexiQuestion.value.trim() || !selectedTask.value) return
  
  // Simulate AI response to user question
  const aiResponse = {
    type: 'ai_suggestion',
    content: `Respuesta de Lexi a: "${lexiQuestion.value}"\n\nBasándome en tu pregunta, te sugiero lo siguiente: [Esta sería una respuesta personalizada de IA basada en el contexto de tu tarea y pregunta específica]`,
    ai_context: 'user_question'
  }
  
  projectsStore.addContentBlock(selectedTask.value.id, aiResponse)
  selectedTask.value.content_blocks.push({
    ...aiResponse,
    id: Date.now().toString(),
    created_at: new Date().toISOString()
  })
  
  lexiQuestion.value = ''
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  if (route.params.id) {
    projectsStore.loadProject(route.params.id)
  }
})
</script>