<template>
    <div class="paginated-editor">
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

            <div class="toolbar-divider"></div>

            <!-- Botón de sugerencia IA -->
            <button @click="handleAISuggestion" :disabled="isLoadingSuggestion || !editor" class="ai-suggestion-btn"
                type="button" title="Obtener sugerencia de IA (Ctrl+Espacio)">
                <span v-if="isLoadingSuggestion" class="animate-spin">⏳</span>
                <span v-else>💡</span>
                <span class="ml-2">{{ isLoadingSuggestion ? 'Generando...' : 'Sugerencia IA' }}</span>
            </button>

            <!-- Controles de zoom -->
            <div class="toolbar-group ml-auto">
                <button @click="zoomOut" :disabled="zoom <= 50" class="toolbar-btn" type="button" title="Reducir zoom">
                    −
                </button>
                <span class="zoom-level">{{ zoom }}%</span>
                <button @click="zoomIn" :disabled="zoom >= 150" class="toolbar-btn" type="button" title="Aumentar zoom">
                    +
                </button>
            </div>
        </div>

        <!-- Navegación de páginas -->
        <div class="page-navigation">
            <button @click="goToPreviousPage" :disabled="currentPage === 1" class="nav-btn" type="button"
                title="Página anterior">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <div class="page-info">
                <input v-model.number="pageInputValue" @keyup.enter="goToPageInput" @blur="goToPageInput" type="number"
                    min="1" :max="totalPages" class="page-input" />
                <span class="page-total">de {{ totalPages }}</span>
            </div>

            <button @click="goToNextPage" :disabled="currentPage === totalPages" class="nav-btn" type="button"
                title="Página siguiente">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <button @click="showAllPages = !showAllPages" class="view-toggle-btn" type="button"
                :title="showAllPages ? 'Vista por página' : 'Vista continua'">
                {{ showAllPages ? '📄' : '📜' }}
            </button>
        </div>

        <!-- Editor con página única o continua -->
        <div class="pages-container" ref="pagesContainer">
            <div class="pages-wrapper" :style="{ transform: `scale(${zoom / 100})` }">
                <div v-if="showAllPages" class="continuous-view">
                    <editor-content :editor="editor" class="paginated-content" />
                </div>
                <div v-else class="single-page-view">
                    <div class="page-content" ref="pageContent">
                        <editor-content :editor="editor" class="paginated-content" />
                    </div>
                </div>
            </div>
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

        <!-- Footer con estadísticas -->
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
    modelValue: '',
    placeholder: 'Comienza a escribir tu documento... Presiona Ctrl+Espacio para obtener sugerencias de IA',
    autosave: true,
    autosaveDelay: 2000
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'save': [content: string]
}>()

// Zoom y paginación
const zoom = ref(100)
const pagesContainer = ref<HTMLElement>()
const pageContent = ref<HTMLElement>()
const currentPage = ref(1)
const totalPages = ref(1)
const pageInputValue = ref(1)
const showAllPages = ref(false)

// Contenido por página (guardamos el HTML de cada página)
const pagesData = ref<string[]>([])
const CHARS_PER_PAGE = 3000 // Aproximadamente 3000 caracteres por página

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

        // Recalcular páginas
        if (!showAllPages.value) {
            calculatePages(html)
        }

        // Autosave
        if (props.autosave) {
            triggerAutosave()
        }
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm max-w-none focus:outline-none px-16 py-12'
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
    if (!editor.value) return

    const { from, to } = editor.value.state.selection
    const docSize = editor.value.state.doc.content.size

    if (from === 0 && to === 0 && docSize > 2) {
        editor.value.chain().focus().setTextSelection(docSize - 1).run()
    } else {
        editor.value.chain().focus().run()
    }

    requestSuggestion(props.bibliography || [], props.projectInfo || null)
}

function acceptSuggestion() {
    acceptAISuggestion()
}

function rejectSuggestion() {
    rejectAISuggestion()
}

function zoomIn() {
    if (zoom.value < 150) {
        zoom.value += 10
    }
}

function zoomOut() {
    if (zoom.value > 50) {
        zoom.value -= 10
    }
}

// Paginación
function calculatePages(html: string) {
    // Dividir el contenido HTML en páginas basándose en longitud de texto
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const textContent = tempDiv.textContent || ''

    const numPages = Math.ceil(textContent.length / CHARS_PER_PAGE) || 1
    totalPages.value = numPages

    // Asegurar que la página actual esté dentro del rango
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
        pageInputValue.value = currentPage.value
    }
}

function goToNextPage() {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
        pageInputValue.value = currentPage.value
        scrollToPageContent()
    }
}

function goToPreviousPage() {
    if (currentPage.value > 1) {
        currentPage.value--
        pageInputValue.value = currentPage.value
        scrollToPageContent()
    }
}

function goToPageInput() {
    const page = pageInputValue.value
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        scrollToPageContent()
    } else {
        // Restaurar valor válido
        pageInputValue.value = currentPage.value
    }
}

function scrollToPageContent() {
    if (!editor.value || showAllPages.value) return

    // Calcular posición aproximada del contenido de la página
    const doc = editor.value.state.doc
    const totalSize = doc.content.size
    const pageSize = totalSize / totalPages.value
    const targetPos = Math.floor((currentPage.value - 1) * pageSize)

    // Scroll a la posición
    editor.value.commands.focus()
    editor.value.commands.setTextSelection(Math.max(0, targetPos))

    // Scroll visual al contenedor
    if (pageContent.value) {
        pageContent.value.scrollTop = 0
    }
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

// Watch
watch(() => props.modelValue, (newValue) => {
    const isSame = editor.value?.getHTML() === newValue
    if (!isSame && editor.value) {
        editor.value.commands.setContent(newValue)
        calculatePages(newValue)
    }
})

watch(showAllPages, (showAll) => {
    if (showAll) {
        // Vista continua: cargar todo el contenido
        if (editor.value) {
            const fullContent = editor.value.getHTML()
            editor.value.commands.setContent(fullContent)
        }
    } else {
        // Vista por página: recalcular páginas
        if (editor.value) {
            calculatePages(editor.value.getHTML())
        }
    }
})

// Lifecycle
onMounted(() => {
    const cleanup = setupKeyboardShortcuts()

    // Calcular páginas iniciales
    if (props.modelValue) {
        calculatePages(props.modelValue)
    }

    onBeforeUnmount(() => {
        cleanup?.()
        if (autosaveTimeout.value) {
            clearTimeout(autosaveTimeout.value)
        }
    })
})
</script>

<style scoped>
.paginated-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f5f5f5;
}

/* Toolbar */
.editor-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    flex-wrap: wrap;
}

.toolbar-group {
    display: flex;
    gap: 0.25rem;
}

.toolbar-divider {
    width: 1px;
    height: 1.5rem;
    background-color: #e5e7eb;
}

.toolbar-btn {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    background-color: transparent;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.toolbar-btn:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
}

.toolbar-btn.is-active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.ai-suggestion-btn {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.ai-suggestion-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ai-suggestion-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.zoom-level {
    padding: 0 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    min-width: 3rem;
    text-align: center;
}

/* Page Navigation */
.page-navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    background-color: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
    background-color: #f3f4f6;
    border-color: #9ca3af;
}

.nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.page-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.page-input {
    width: 4rem;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
}

.page-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.page-total {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.view-toggle-btn {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    background-color: white;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 1.25rem;
}

.view-toggle-btn:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
}

/* Pages Container */
.pages-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #e5e7eb;
    padding: 2rem 0;
}

.pages-wrapper {
    transform-origin: top center;
    transition: transform 0.2s ease;
}

/* Continuous View */
.continuous-view {
    max-width: 210mm;
    margin: 0 auto;
}

.continuous-view :deep(.paginated-content .ProseMirror) {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-height: 297mm;
    padding: 25mm 20mm;

    /* Simular separación de páginas */
    background-image:
        linear-gradient(to bottom,
            white 0%,
            white calc(297mm - 1px),
            #e5e7eb calc(297mm - 1px),
            #e5e7eb calc(297mm + 2rem),
            white calc(297mm + 2rem));
    background-size: 100% calc(297mm + 2rem);
    background-repeat: repeat-y;
}

/* Single Page View */
.single-page-view {
    max-width: 210mm;
    margin: 0 auto;
}

.page-content {
    max-height: calc(100vh - 250px);
    overflow: hidden;
}

.single-page-view :deep(.paginated-content .ProseMirror) {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    height: 297mm;
    max-height: 297mm;
    padding: 25mm 20mm;
    overflow-y: auto;
}

:deep(.paginated-content .ProseMirror p) {
    margin-bottom: 1em;
}

:deep(.paginated-content .ProseMirror h1) {
    font-size: 2em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

:deep(.paginated-content .ProseMirror h2) {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 0.83em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

:deep(.paginated-content .ProseMirror h3) {
    font-size: 1.17em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

:deep(.paginated-content .ProseMirror ul),
:deep(.paginated-content .ProseMirror ol) {
    padding-left: 2em;
    margin-bottom: 1em;
}

:deep(.paginated-content .ProseMirror li) {
    margin-bottom: 0.5em;
}

/* Suggestion Popup */
.suggestion-popup {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    z-index: 1000;
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.suggestion-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.suggestion-icon {
    font-size: 1.25rem;
}

.suggestion-title {
    font-weight: 600;
    color: #1f2937;
}

.suggestion-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-accept,
.btn-reject {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.btn-accept {
    background-color: #10b981;
    color: white;
    border: none;
}

.btn-accept:hover {
    background-color: #059669;
}

.btn-reject {
    background-color: #ef4444;
    color: white;
    border: none;
}

.btn-reject:hover {
    background-color: #dc2626;
}

/* Error */
.ai-error {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}

.error-icon {
    font-size: 1.25rem;
}

.close-error {
    margin-left: auto;
    color: #dc2626;
    font-weight: bold;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
}

/* Footer */
.editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: white;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.ml-auto {
    margin-left: auto;
}

.ml-2 {
    margin-left: 0.5rem;
}

.text-sm {
    font-size: 0.875rem;
}

.text-gray-500 {
    color: #6b7280;
}

.text-gray-400 {
    color: #9ca3af;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
