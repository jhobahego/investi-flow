<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar />

    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center space-x-4 min-w-0">
          <button @click="handleGoBack" class="p-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0">
            <ArrowLeftIcon class="w-5 h-5" />
          </button>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <LexiAvatar :show-name="false" class="scale-90 flex-shrink-0" :is-active="isTyping" />
              <span class="truncate">Chat con Lexi</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 truncate">{{ projectName }}</p>
          </div>
        </div>

        <!-- Botón para ver conversaciones -->
        <button v-if="!showSidebar" @click="showSidebar = true"
          class="w-full sm:w-auto px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
          <ChatBubbleLeftRightIcon class="w-4 h-4" />
          <span>Conversaciones</span>
        </button>
      </div>

      <!-- Layout principal -->
      <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <!-- Sidebar de conversaciones -->
        <div v-if="showSidebar"
          class="w-full lg:w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col max-h-[400px] lg:max-h-[calc(100vh-200px)]">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Conversaciones</h2>
            <button @click="showSidebar = false" class="p-1 text-gray-400 hover:text-gray-600 lg:hidden">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Lista de conversaciones -->
          <div class="flex-1 overflow-y-auto space-y-2">
            <div v-for="conv in conversations" :key="conv.id" @click="selectConversation(conv.id)"
              class="p-3 rounded-lg cursor-pointer transition-colors border"
              :class="currentConversationId === conv.id ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50 border-transparent'">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ conv.title }}</p>
                  <p class="text-xs text-gray-500 mt-1 truncate">
                    {{ conv.last_message_preview || 'Sin mensajes' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatRelativeTime(conv.updated_at) }} · {{ conv.message_count }} mensajes
                  </p>
                </div>
                <button @click.stop="handleDeleteConversation(conv.id)"
                  class="p-1 text-gray-400 hover:text-red-600 transition-colors">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="conversations.length === 0" class="text-center py-8 text-gray-500 text-sm">
              No hay conversaciones previas
            </div>
          </div>

          <!-- Botón nueva conversación -->
          <button @click="startNewConversation"
            class="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
            <PlusIcon class="w-4 h-4" />
            <span>Nueva Conversación</span>
          </button>
        </div>

        <!-- Área de chat -->
        <div
          class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[500px] lg:max-h-[calc(100vh-200px)]">
          <!-- Mensajes -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <!-- Empty state -->
            <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center px-4">
              <LexiAvatar :show-name="false" class="scale-125 sm:scale-150 mb-4" />
              <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-2">Inicia una conversación</h3>
              <p class="text-sm sm:text-base text-gray-500 max-w-md">
                Pregúntame cualquier cosa sobre tu proyecto de investigación. Puedo ayudarte con
                estructura, metodología,
                análisis y más.
              </p>
            </div>

            <!-- Mensajes -->
            <div v-for="(message, index) in messages" :key="index">
              <!-- Mensaje del usuario -->
              <div v-if="message.role === 'user'" class="flex justify-end mb-4">
                <div class="max-w-[85%] sm:max-w-[70%] bg-primary-600 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                  <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
                </div>
              </div>

              <!-- Mensaje del asistente -->
              <div v-else class="flex items-start mb-4 space-x-2 sm:space-x-3">
                <LexiAvatar :show-name="false" class="mt-1 flex-shrink-0" />
                <div class="max-w-[85%] sm:max-w-[70%] bg-gray-100 text-gray-900 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                  <div class="text-sm markdown-content" v-dompurify-html="renderMarkdown(message.content)"></div>
                  <p v-if="message.model_used" class="text-xs text-gray-500 mt-2">
                    {{ message.model_used }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Indicador de escritura -->
            <div v-if="isTyping" class="flex items-start space-x-2 sm:space-x-3">
              <LexiAvatar :show-name="false" :is-active="true" class="flex-shrink-0" />
              <div class="bg-gray-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input de mensaje -->
          <div class="border-t border-gray-200 p-3 sm:p-4">
            <form @submit.prevent="handleSendMessage" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <textarea v-model="currentMessage" @keydown.enter.exact.prevent="handleSendMessage"
                placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)" rows="2"
                class="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                :disabled="isTyping"></textarea>
              <button type="submit" :disabled="!currentMessage.trim() || isTyping"
                class="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm">
                <PaperAirplaneIcon class="w-4 sm:w-5 h-4 sm:h-5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useToast } from '../composables/useToast'
import { chatService } from '../api/chatService'
import AppNavbar from '../components/layout/AppNavbar.vue'
import LexiAvatar from '../components/ui/LexiAvatar.vue'
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon
} from '@heroicons/vue/24/outline'
import type { ChatMessage, ConversationListItem } from '../types'
import { marked } from 'marked'

// Configurar marked para opciones de seguridad
marked.setOptions({
  breaks: true, // Convertir saltos de línea en <br>
  gfm: true, // GitHub Flavored Markdown
})

// Función para convertir Markdown a HTML
const renderMarkdown = (content: string): string => {
  return marked.parse(content) as string
}

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const { showSuccess, showError } = useToast()

// Estado
const messages = ref<ChatMessage[]>([])
const conversations = ref<ConversationListItem[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const showSidebar = ref(true)
const currentConversationId = ref<number | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

// Computed
const projectId = computed(() => Number(route.params.id))
const projectName = computed(() => projectsStore.currentProject?.name || 'Proyecto')

// Funciones
const handleGoBack = () => {
  router.push(`/project/${projectId.value}`)
}

const loadConversations = async () => {
  try {
    conversations.value = await chatService.getConversations(projectId.value)
  } catch (error) {
    console.error('Error loading conversations:', error)
  }
}

const selectConversation = async (conversationId: number) => {
  try {
    const conversation = await chatService.getConversation(projectId.value, conversationId)
    messages.value = conversation.messages
    currentConversationId.value = conversationId
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error loading conversation:', error)
    showError('Error al cargar la conversación')
  }
}

const startNewConversation = () => {
  messages.value = []
  currentConversationId.value = null
  currentMessage.value = ''
}

const handleSendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value) return

  const userMessage = currentMessage.value.trim()
  currentMessage.value = ''

  // Agregar mensaje del usuario a la UI
  messages.value.push({
    role: 'user',
    content: userMessage
  })

  await nextTick()
  scrollToBottom()

  isTyping.value = true

  try {
    const response = await chatService.sendMessage(projectId.value, {
      message: userMessage,
      conversation_id: currentConversationId.value,
      title: currentConversationId.value ? undefined : 'Nueva conversación'
    })

    // Actualizar ID de conversación si era nueva
    if (!currentConversationId.value) {
      currentConversationId.value = response.conversation_id
      await loadConversations()
    }

    // Agregar respuesta del asistente
    messages.value.push({
      id: response.message_id,
      role: 'model',
      content: response.response,
      model_used: response.model_used
    })

    await nextTick()
    scrollToBottom()
  } catch (error: any) {
    console.error('Error sending message:', error)
    showError(error.response?.data?.detail?.message || 'Error al enviar el mensaje')
  } finally {
    isTyping.value = false
  }
}

const handleDeleteConversation = async (conversationId: number) => {
  if (!confirm('¿Estás seguro de eliminar esta conversación?')) return

  try {
    await chatService.deleteConversation(projectId.value, conversationId)
    await loadConversations()

    if (currentConversationId.value === conversationId) {
      startNewConversation()
    }

    showSuccess('Conversación eliminada')
  } catch (error) {
    console.error('Error deleting conversation:', error)
    showError('Error al eliminar la conversación')
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString()
}

// Lifecycle
onMounted(async () => {
  await projectsStore.fetchProjectWithPhases(projectId.value)
  await loadConversations()
})

// Watch para scroll automático
watch(() => messages.value.length, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
/* Estilos para contenido Markdown renderizado */
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.15em;
}

.markdown-content :deep(h4) {
  font-size: 1em;
}

.markdown-content :deep(p) {
  margin-bottom: 0.75em;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 0.75em;
  padding-left: 1.5em;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
  list-style-position: outside;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
  list-style-position: outside;
}

.markdown-content :deep(ul ul) {
  list-style-type: circle;
}

.markdown-content :deep(ul ul ul) {
  list-style-type: square;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25em;
  display: list-item;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
  margin-bottom: 0.75em;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1em;
  margin-left: 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: #2563eb;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5em 0;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.75em;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.5em;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
</style>