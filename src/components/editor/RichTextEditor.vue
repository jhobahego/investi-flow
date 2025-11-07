<template>
    <div class="rich-text-editor">
        <!-- Toolbar -->
        <div class="editor-toolbar">
            <div class="toolbar-group">
                <!-- Formato de texto -->
                <button @click="editor?.chain().focus().toggleBold().run()"
                    :class="{ 'is-active': editor?.isActive('bold') }" class="toolbar-btn" type="button"
                    title="Negrita (Ctrl+B)">
                    <strong>B</strong>
                </button>
                <button @click="editor?.chain().focus().toggleItalic().run()"
                    :class="{ 'is-active': editor?.isActive('italic') }" class="toolbar-btn" type="button"
                    title="Cursiva (Ctrl+I)">
                    <em>I</em>
                </button>
                <button @click="editor?.chain().focus().toggleUnderline().run()"
                    :class="{ 'is-active': editor?.isActive('underline') }" class="toolbar-btn" type="button"
                    title="Subrayado (Ctrl+U)">
                    <u>U</u>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <!-- Títulos -->
                <button @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
                    :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }" class="toolbar-btn"
                    type="button" title="Título 1">
                    H1
                </button>
                <button @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
                    :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }" class="toolbar-btn"
                    type="button" title="Título 2">
                    H2
                </button>
                <button @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
                    :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }" class="toolbar-btn"
                    type="button" title="Título 3">
                    H3
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <!-- Listas -->
                <button @click="editor?.chain().focus().toggleBulletList().run()"
                    :class="{ 'is-active': editor?.isActive('bulletList') }" class="toolbar-btn" type="button"
                    title="Lista con viñetas">
                    •
                </button>
                <button @click="editor?.chain().focus().toggleOrderedList().run()"
                    :class="{ 'is-active': editor?.isActive('orderedList') }" class="toolbar-btn" type="button"
                    title="Lista numerada">
                    1.
                </button>
            </div>

            <!-- Botón de sugerencia IA -->
            <button @click="handleAISuggestion" :disabled="isLoadingSuggestion || !editor" class="ai-suggestion-btn"
                type="button" title="Obtener sugerencia de IA (Ctrl+Espacio)">
                <span v-if="isLoadingSuggestion" class="animate-spin">⏳</span>
                <span v-else>💡</span>
                <span class="ml-2">{{ isLoadingSuggestion ? 'Generando...' : 'Sugerencia IA' }}</span>
            </button>
        </div>

        <!-- Editor Content -->
        <div class="editor-wrapper">
            <editor-content :editor="editor" class="editor-content" />
        </div>

        <!-- Popup de sugerencia -->
        <div v-if="currentSuggestion && !isLoadingSuggestion" class="suggestion-popup">
            <div class="suggestion-header">
                <span class="suggestion-icon">✨</span>
                <span class="suggestion-title">Sugerencia de IA</span>
            </div>
            <div class="suggestion-actions">
                <button @click="acceptSuggestion" class="btn-accept" type="button">
                    ✓ Aceptar (Tab)
                </button>
                <button @click="rejectSuggestion" class="btn-reject" type="button">
                    ✕ Rechazar (Esc)
                </button>
            </div>
        </div>

        <!-- Error de IA -->
        <div v-if="suggestionError" class="ai-error">
            <span class="error-icon">⚠️</span>
            <span>{{ suggestionError }}</span>
            <button @click="clearSuggestion" class="close-error" type="button">✕</button>
        </div>

        <!-- Estadísticas del documento -->
        <div class="editor-footer">
            <span class="text-sm text-gray-500">
                {{ wordCount }} palabras • {{ characterCount }} caracteres
            </span>
            <span v-if="lastSaved" class="text-sm text-gray-400">
                Guardado {{ lastSaved }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useAISuggestions } from '../../composables/useAISuggestions'

interface Props {
    modelValue: string
    projectId?: number
    bibliography?: any[]
    projectInfo?: any
    placeholder?: string
    autosave?: boolean
    autosaveDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Comienza a escribir tu documento... Presiona Ctrl+Espacio para obtener sugerencias de IA',
    autosave: true,
    autosaveDelay: 2000
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'save': [content: string]
}>()

// Editor instance
const editor = useEditor({
    content: props.modelValue,
    extensions: [
        StarterKit,
        Placeholder.configure({
            placeholder: props.placeholder
        }),
        Underline,
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'text-primary-600 underline hover:text-primary-700'
            }
        })
    ],
    onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        emit('update:modelValue', html)

        // Autosave
        if (props.autosave) {
            triggerAutosave()
        }
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] max-w-none'
        }
    }
})

// AI Suggestions
const {
    isLoading: isLoadingSuggestion,
    suggestion: currentSuggestion,
    error: suggestionError,
    requestSuggestion,
    acceptSuggestion: acceptAISuggestion,
    rejectSuggestion: rejectAISuggestion,
    clearSuggestion
} = useAISuggestions(editor)

// Autosave
const lastSaved = ref<string>('')
const autosaveTimeout = ref<NodeJS.Timeout>()

// Computed
const wordCount = computed(() => {
    if (!editor.value) return 0
    const text = editor.value.getText()
    return text.split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
    if (!editor.value) return 0
    return editor.value.getText().length
})

// Methods
function handleAISuggestion() {
    // Asegurar que el editor tenga el foco antes de solicitar sugerencia
    if (!editor.value) {
        console.warn('Editor no disponible')
        return
    }

    // Si no hay selección o el cursor está al inicio, posicionarlo al final del contenido
    const { from, to } = editor.value.state.selection
    const docSize = editor.value.state.doc.content.size
    
    // Si el cursor está al principio o no hay contenido, moverlo al final
    if (from === 0 && to === 0 && docSize > 2) {
        editor.value.chain().focus().setTextSelection(docSize - 1).run()
        console.log('📍 Cursor movido al final del documento para sugerencia')
    } else {
        // Asegurar que el editor tiene foco
        editor.value.chain().focus().run()
    }

    // Solicitar sugerencia
    requestSuggestion(props.bibliography || [], props.projectInfo || null)
}

function acceptSuggestion() {
    acceptAISuggestion()
}

function rejectSuggestion() {
    rejectAISuggestion()
}

function triggerAutosave() {
    if (autosaveTimeout.value) {
        clearTimeout(autosaveTimeout.value)
    }

    autosaveTimeout.value = setTimeout(() => {
        const content = editor.value?.getHTML() || ''
        emit('save', content)
        updateLastSaved()
    }, props.autosaveDelay)
}

function updateLastSaved() {
    const now = new Date()
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    lastSaved.value = time
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    if (!editor.value) return

    const handleKeydown = (event: KeyboardEvent) => {
        // Ctrl+Space para sugerencias
        if (event.ctrlKey && event.code === 'Space') {
            event.preventDefault()
            handleAISuggestion()
        }

        // Tab para aceptar sugerencia
        if (event.key === 'Tab' && currentSuggestion.value) {
            event.preventDefault()
            acceptSuggestion()
        }

        // Esc para rechazar sugerencia
        if (event.key === 'Escape' && currentSuggestion.value) {
            event.preventDefault()
            rejectSuggestion()
        }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
        document.removeEventListener('keydown', handleKeydown)
    }
}

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
    const isSame = editor.value?.getHTML() === newValue
    if (!isSame && editor.value) {
        editor.value.commands.setContent(newValue)
    }
})

// Lifecycle
onMounted(() => {
    const cleanup = setupKeyboardShortcuts()
    onBeforeUnmount(() => {
        cleanup?.()
        if (autosaveTimeout.value) {
            clearTimeout(autosaveTimeout.value)
        }
    })
})

onBeforeUnmount(() => {
    editor.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
    @apply border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm;
}

.editor-toolbar {
    @apply flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap;
}

.toolbar-group {
    @apply flex items-center gap-1;
}

.toolbar-divider {
    @apply w-px h-6 bg-gray-300 mx-1;
}

.toolbar-btn {
    @apply px-3 py-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 font-medium text-sm;
}

.toolbar-btn.is-active {
    @apply bg-primary-100 text-primary-700;
}

.ai-suggestion-btn {
    @apply ml-auto flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-sm text-white transition-all;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-suggestion-btn:hover:not(:disabled) {
    @apply shadow-md transform scale-105;
}

.ai-suggestion-btn:disabled {
    @apply opacity-60 cursor-not-allowed;
}

.editor-wrapper {
    @apply relative;
}

.editor-content {
    @apply p-4 min-h-[400px];
}

.editor-content :deep(.ProseMirror) {
    @apply outline-none;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
    @apply text-gray-400;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
}

.suggestion-popup {
    @apply fixed bottom-20 right-8 bg-white border-2 border-primary-400 rounded-lg shadow-2xl p-4 z-50;
    min-width: 280px;
    animation: slideUp 0.3s ease-out;
}

.suggestion-header {
    @apply flex items-center gap-2 mb-3 pb-2 border-b border-gray-200;
}

.suggestion-icon {
    @apply text-xl;
}

.suggestion-title {
    @apply font-semibold text-gray-800;
}

.suggestion-actions {
    @apply flex gap-2;
}

.btn-accept {
    @apply flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm;
}

.btn-reject {
    @apply flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-sm;
}

.ai-error {
    @apply flex items-center gap-2 p-3 m-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm;
}

.error-icon {
    @apply text-lg;
}

.close-error {
    @apply ml-auto text-red-600 hover:text-red-800 font-bold;
}

.editor-footer {
    @apply flex justify-between items-center px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs;
}

@keyframes slideUp {
    from {
        transform: translateY(1rem);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>
