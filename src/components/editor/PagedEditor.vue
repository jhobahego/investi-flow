<template>
    <div class="paged-editor">
        <!-- Toolbar -->
        <div class="editor-toolbar">
            <div class="toolbar-group">
                <!-- Formato de texto -->
                <button @click="applyFormat('bold')" :class="{ 'is-active': isActive('bold') }" class="toolbar-btn"
                    type="button" title="Negrita (Ctrl+B)">
                    <strong>B</strong>
                </button>
                <button @click="applyFormat('italic')" :class="{ 'is-active': isActive('italic') }" class="toolbar-btn"
                    type="button" title="Cursiva (Ctrl+I)">
                    <em>I</em>
                </button>
                <button @click="applyFormat('underline')" :class="{ 'is-active': isActive('underline') }"
                    class="toolbar-btn" type="button" title="Subrayado (Ctrl+U)">
                    <u>U</u>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <!-- Títulos -->
                <button @click="applyHeading(1)" :class="{ 'is-active': isActive('heading', { level: 1 }) }"
                    class="toolbar-btn" type="button" title="Título 1">
                    H1
                </button>
                <button @click="applyHeading(2)" :class="{ 'is-active': isActive('heading', { level: 2 }) }"
                    class="toolbar-btn" type="button" title="Título 2">
                    H2
                </button>
                <button @click="applyHeading(3)" :class="{ 'is-active': isActive('heading', { level: 3 }) }"
                    class="toolbar-btn" type="button" title="Título 3">
                    H3
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <!-- Listas -->
                <button @click="applyFormat('bulletList')" :class="{ 'is-active': isActive('bulletList') }"
                    class="toolbar-btn" type="button" title="Lista con viñetas">
                    •
                </button>
                <button @click="applyFormat('orderedList')" :class="{ 'is-active': isActive('orderedList') }"
                    class="toolbar-btn" type="button" title="Lista numerada">
                    1.
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <!-- Botón de sugerencia IA -->
            <button @click="handleAISuggestion" :disabled="isLoadingSuggestion || !currentEditor"
                class="ai-suggestion-btn" type="button" title="Obtener sugerencia de IA (Ctrl+Espacio)">
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
            <button @click="goToPreviousPage" :disabled="currentPage === 1 || continuousView" class="nav-btn"
                type="button" title="Página anterior">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <div class="page-info">
                <input v-model.number="pageInputValue" @keyup.enter="goToPageInput" @blur="goToPageInput" type="number"
                    min="1" :max="pages.length" class="page-input" :disabled="continuousView" />
                <span class="page-total">de {{ pages.length }}</span>
            </div>

            <button @click="goToNextPage" :disabled="currentPage === pages.length || continuousView" class="nav-btn"
                type="button" title="Página siguiente">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <div class="toolbar-divider"></div>

            <button @click="toggleView" class="view-toggle-btn" type="button"
                :title="continuousView ? 'Vista por páginas' : 'Vista continua'">
                <svg v-if="continuousView" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </button>
        </div>

        <!-- Editor: Vista por página o vista continua -->
        <div class="pages-container" ref="pagesContainer">
            <div class="pages-wrapper" :style="{ transform: `scale(${zoom / 100})` }">
                <!-- Vista por página única -->
                <div v-if="!continuousView" class="page-view">
                    <editor-content :editor="(currentEditor as any)" class="page-content" />
                </div>

                <!-- Vista continua con scroll -->
                <div v-else class="continuous-view">
                    <div v-for="(page, index) in pages" :key="index" class="page-separator">
                        <div class="page-number">Página {{ index + 1 }}</div>
                        <div class="page-content-static" v-html="page"></div>
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
import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useAISuggestions } from '../../composables/useAISuggestions'
import { SuggestionMark } from './SuggestionMark'

interface Props {
    pages: string[]
    projectId?: number
    bibliography?: any[]
    projectInfo?: any
    placeholder?: string
    autosave?: boolean
    autosaveDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
    pages: () => ['<p></p>'],
    placeholder: 'Comienza a escribir tu documento... Presiona Ctrl+Espacio para obtener sugerencias de IA',
    autosave: true,
    autosaveDelay: 2000
})

const emit = defineEmits<{
    'update:pages': [pages: string[]]
    'save': [pages: string[]]
}>()

// Paginación
const currentPage = ref(1)
const pageInputValue = ref(1)
const zoom = ref(100)
const pagesContainer = ref<HTMLElement>()
const continuousView = ref(false) // Vista continua vs vista por página

// Editor por página
const currentEditor = ref<Editor | undefined>(undefined)

// Autosave
const lastSaved = ref<string>('')
const autosaveTimeout = ref<NodeJS.Timeout>()

// Crear editor para la página actual
function createEditorForPage(pageIndex: number) {
    if (currentEditor.value) {
        currentEditor.value.destroy()
    }

    currentEditor.value = new Editor({
        content: props.pages[pageIndex] || '<p></p>',
        extensions: [
            StarterKit.configure({
                // StarterKit no incluye estas extensiones por defecto, las agregamos manualmente
            }),
            Placeholder.configure({
                placeholder: props.placeholder
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary-600 underline hover:text-primary-700'
                }
            }),
            SuggestionMark
        ],
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            updatePageContent(pageIndex, html)

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
}

function updatePageContent(pageIndex: number, html: string) {
    const newPages = [...props.pages]
    newPages[pageIndex] = html
    emit('update:pages', newPages)
}

// AI Suggestions
const {
    isLoading: isLoadingSuggestion,
    suggestion: currentSuggestion,
    error: suggestionError,
    requestSuggestion,
    acceptSuggestion: acceptAISuggestion,
    rejectSuggestion: rejectAISuggestion,
    clearSuggestion
} = useAISuggestions(currentEditor as Ref<Editor | undefined>)

// Computed
const wordCount = computed(() => {
    if (!currentEditor.value) return 0
    const text = currentEditor.value.getText()
    return text.split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
    if (!currentEditor.value) return 0
    return currentEditor.value.getText().length
})

// Methods
function applyFormat(format: string) {
    if (!currentEditor.value) return

    switch (format) {
        case 'bold':
            currentEditor.value.chain().focus().toggleBold().run()
            break
        case 'italic':
            currentEditor.value.chain().focus().toggleItalic().run()
            break
        case 'underline':
            currentEditor.value.chain().focus().toggleUnderline().run()
            break
        case 'bulletList':
            currentEditor.value.chain().focus().toggleBulletList().run()
            break
        case 'orderedList':
            currentEditor.value.chain().focus().toggleOrderedList().run()
            break
    }
}

function applyHeading(level: 1 | 2 | 3) {
    if (!currentEditor.value) return
    currentEditor.value.chain().focus().toggleHeading({ level }).run()
}

function isActive(name: string, attrs?: any) {
    if (!currentEditor.value) return false
    return currentEditor.value.isActive(name, attrs)
}

function handleAISuggestion() {
    if (!currentEditor.value) return

    // Primero enfocar el editor
    currentEditor.value.chain().focus().run()

    const { from, to } = currentEditor.value.state.selection
    const docSize = currentEditor.value.state.doc.content.size

    if ((from === 0 && to === 0) || from === to) {
        const endPos = Math.max(1, docSize - 1)
        currentEditor.value.chain().focus().setTextSelection(endPos).run()
    }
    setTimeout(() => {
        requestSuggestion(props.bibliography || [], props.projectInfo || null)
    }, 50)
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

function goToNextPage() {
    if (currentPage.value < props.pages.length) {
        currentPage.value++
        pageInputValue.value = currentPage.value
        createEditorForPage(currentPage.value - 1)
    }
}

function goToPreviousPage() {
    if (currentPage.value > 1) {
        currentPage.value--
        pageInputValue.value = currentPage.value
        createEditorForPage(currentPage.value - 1)
    }
}

function goToPageInput() {
    const page = pageInputValue.value
    if (page >= 1 && page <= props.pages.length) {
        currentPage.value = page
        createEditorForPage(currentPage.value - 1)
    } else {
        pageInputValue.value = currentPage.value
    }
}

function toggleView() {
    continuousView.value = !continuousView.value

    // Si volvemos a vista por páginas, recrear el editor
    if (!continuousView.value) {
        createEditorForPage(currentPage.value - 1)
    } else {
        // En vista continua, destruir el editor actual
        if (currentEditor.value) {
            currentEditor.value.destroy()
            currentEditor.value = undefined
        }
    }
}

function triggerAutosave() {
    if (autosaveTimeout.value) {
        clearTimeout(autosaveTimeout.value)
    }

    autosaveTimeout.value = setTimeout(() => {
        emit('save', props.pages)
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
watch(() => props.pages, () => {
    // Si la página actual ya no existe, ir a la última página
    if (currentPage.value > props.pages.length) {
        currentPage.value = props.pages.length || 1
        pageInputValue.value = currentPage.value
    }
    // Recrear el editor con el contenido actualizado solo si estamos en vista por páginas
    if (!continuousView.value) {
        createEditorForPage(currentPage.value - 1)
    }
}, { deep: true })

// Auto-dismiss error después de 5 segundos
watch(suggestionError, (newError) => {
    if (newError) {
        setTimeout(() => {
            if (suggestionError.value === newError) {
                clearSuggestion()
            }
        }, 5000)
    }
})

// Lifecycle
onMounted(() => {
    createEditorForPage(0)
    const cleanup = setupKeyboardShortcuts()

    onBeforeUnmount(() => {
        cleanup?.()
        if (currentEditor.value) {
            currentEditor.value.destroy()
        }
        if (autosaveTimeout.value) {
            clearTimeout(autosaveTimeout.value)
        }
    })
})
</script>

<style scoped>
.paged-editor {
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

/* Vista por página única */
.page-view {
    max-width: 210mm;
    margin: 0 auto;
}

:deep(.page-content .ProseMirror) {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-height: 297mm;
    height: auto;
    padding: 25mm 20mm;
}

/* Vista continua con scroll */
.continuous-view {
    max-width: 210mm;
    margin: 0 auto;
    max-height: calc(100vh - 280px);
    overflow-y: auto;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

.page-separator {
    position: relative;
    border-bottom: 2px dashed #e5e7eb;
    padding: 25mm 20mm;
}

.page-separator:last-child {
    border-bottom: none;
}

.page-number {
    position: absolute;
    top: 10px;
    right: 20px;
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
}

.page-content-static {
    min-height: 297mm;
}

.page-content-static :deep(p) {
    margin-bottom: 1em;
}

.page-content-static :deep(h1) {
    font-size: 2em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

.page-content-static :deep(h2) {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 0.83em;
    margin-bottom: 0.5em;
}

.page-content-static :deep(h3) {
    font-size: 1.17em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

.page-content-static :deep(ul),
.page-content-static :deep(ol) {
    padding-left: 2em;
    margin-bottom: 1em;
}

.page-content-static :deep(li) {
    margin-bottom: 0.5em;
}

.page-content-static :deep(strong) {
    font-weight: bold;
}

.page-content-static :deep(em) {
    font-style: italic;
}

.page-content-static :deep(u) {
    text-decoration: underline;
}

:deep(.page-content .ProseMirror p) {
    margin-bottom: 1em;
}

:deep(.page-content .ProseMirror h1) {
    font-size: 2em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

:deep(.page-content .ProseMirror h2) {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 0.83em;
    margin-bottom: 0.5em;
}

:deep(.page-content .ProseMirror h3) {
    font-size: 1.17em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

:deep(.page-content .ProseMirror ul),
:deep(.page-content .ProseMirror ol) {
    padding-left: 2em;
    margin-bottom: 1em;
}

:deep(.page-content .ProseMirror li) {
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

/* Estilos para sugerencias de IA */
:deep(.ai-suggestion-mark) {
    background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
    background-size: 200% 100%;
    animation: shimmer 2s ease-in-out infinite;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
    position: relative;
}

:deep(.ai-suggestion-mark::before) {
    content: '✨';
    position: absolute;
    left: -1.25rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    opacity: 0.7;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }

    50% {
        background-position: 0 0;
    }

    100% {
        background-position: -200% 0;
    }
}
</style>
