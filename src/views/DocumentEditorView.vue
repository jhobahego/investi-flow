<template>
    <div class="min-h-screen bg-gray-100 flex flex-col h-screen overflow-hidden">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 z-10">
            <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 max-w-7xl mx-auto w-full">
                <div class="flex items-center gap-4">
                    <button @click="goBack"
                        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        type="button">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div class="min-w-0">
                        <h1 class="text-lg font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                            {{ documentTitle }}
                        </h1>
                        <p class="text-xs text-gray-500 truncate">
                            {{ projectName }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button @click="showBibliography = !showBibliography"
                        :class="['flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium', showBibliography ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100']"
                        type="button">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span class="hidden sm:inline">Bibliografía</span>
                    </button>

                    <button @click="saveDocument" :disabled="isSaving"
                        class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                        type="button">
                        <span v-if="isSaving" class="animate-spin">⏳</span>
                        <span v-else>💾</span>
                        <span class="hidden sm:inline">{{ isSaving ? 'Guardando...' : 'Guardar' }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex overflow-hidden relative">
            <!-- Editor Area -->
            <div class="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8" id="editor-container">
                <div class="max-w-4xl mx-auto">
                    <!-- Mensaje informativo -->
                    <div
                        class="info-banner mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <div class="flex items-start gap-2">
                            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span><strong>Nota:</strong> El editor extrae automáticamente el contenido de archivos .docx
                                desde el servidor.</span>
                        </div>
                    </div>

                    <PagedEditor :pages="documentPages" :project-id="projectId" :bibliography="bibliography"
                        :project-info="projectInfo" @update:pages="documentPages = $event"
                        @save="handleAutosavePages" />
                </div>
            </div>

            <!-- Bibliography Sidebar -->
            <div v-if="showBibliography"
                class="w-80 bg-white border-l border-gray-200 flex-shrink-0 shadow-lg z-20 transition-all duration-300 ease-in-out absolute inset-y-0 right-0 sm:relative">
                <BibliographyPanel :project-id="projectId" :project-info="projectInfo"
                    :document-context="documentPages.join('\n')" />
            </div>
        </div>

        <!-- Loading overlay -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="mt-4 text-gray-600">Cargando documento...</p>
            </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-banner">
            <span class="error-icon">⚠️</span>
            <span>{{ error }}</span>
            <button @click="error = null" class="close-error" type="button">✕</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useAttachmentsStore } from '../stores/attachments'
import { useBibliographyStore } from '../stores/bibliography'
import PagedEditor from '../components/editor/PagedEditor.vue'
import BibliographyPanel from '../components/editor/BibliographyPanel.vue'
import { extractDocumentPages, updateDocumentContent } from '../api/documentService'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const attachmentsStore = useAttachmentsStore()
const bibliographyStore = useBibliographyStore()

// State
const documentPages = ref<string[]>(['<p></p>'])
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showBibliography = ref(false)

// Route params
const projectId = computed(() => Number(route.params.id))
const entityType = computed(() => route.query.entityType as 'project' | 'phase' | 'task' || 'project')
const entityId = computed(() => Number(route.query.entityId) || projectId.value)

// Project data
const currentProject = computed(() => projectsStore.currentProject)
const projectName = computed(() => currentProject.value?.name || 'Proyecto')
const documentTitle = computed(() => {
    const cacheKey = `${entityType.value}-${entityId.value}`
    const attachment = attachmentsStore.attachments[cacheKey]
    return attachment?.file_name || 'Nuevo Documento'
})

// Bibliography (from store)
const bibliography = computed(() => bibliographyStore.bibliographies)

const projectInfo = computed(() => ({
    name: currentProject.value?.name,
    description: currentProject.value?.description || undefined,
    research_type: currentProject.value?.research_type || undefined
}))

// LocalStorage key for document content
const getStorageKey = () => `document_content_${entityType.value}_${entityId.value}`

// Methods
function goBack() {
    router.back()
}

async function loadDocument() {
    isLoading.value = true
    error.value = null

    try {
        // Cargar proyecto si no está cargado
        if (!currentProject.value || currentProject.value.id !== projectId.value) {
            await projectsStore.fetchProjectById(projectId.value)
        }

        // Cargar bibliografía
        await bibliographyStore.fetchBibliographies(projectId.value)

        // 1. Intentar obtener el adjunto
        let document = null
        try {
            document = await attachmentsStore.getDocument(
                entityType.value,
                entityId.value
            )
        } catch (err) {
            console.warn('No se pudo obtener información del documento:', err)
        }

        // 2. Si hay documento, intentar extraer su contenido del servidor en páginas
        if (document && document.id) {
            try {
                const pagesData = await extractDocumentPages(document.id)

                if (pagesData.pages && pagesData.pages.length > 0) {
                    documentPages.value = pagesData.pages
                    console.log('✅ Contenido extraído del documento .docx del servidor')

                    // Guardar en localStorage para acceso offline
                    const storageKey = getStorageKey()
                    localStorage.setItem(storageKey, JSON.stringify(pagesData.pages))

                    return
                }
            } catch (extractError: any) {
                console.warn('⚠️ No se pudo extraer contenido del servidor:', extractError.message)
            }
        }

        // 3. Fallback: Intentar cargar desde localStorage
        const storageKey = getStorageKey()
        const savedContent = localStorage.getItem(storageKey)

        if (savedContent) {
            try {
                const pages = JSON.parse(savedContent)
                if (Array.isArray(pages)) {
                    documentPages.value = pages
                    console.log('📦 Contenido cargado desde localStorage')
                    return
                }
            } catch {
                // Si falla el parse, continuar
            }
        }

        // 4. Si hay documento pero no se pudo extraer, crear plantilla con el nombre
        if (document) {
            const fileName = document.file_name.replace(/\.[^/.]+$/, '')
            documentPages.value = [`<h1>${fileName}</h1><p>Comienza a escribir el contenido de tu documento aquí...</p>`]
        } else {
            // 5. No hay documento, crear uno nuevo vacío
            documentPages.value = ['<h1>Nuevo Documento</h1><p>Comienza a escribir tu documento aquí...</p>']
        }
    } catch (err: any) {
        console.error('Error al cargar documento:', err)
        error.value = err.message || 'Error al cargar el documento'
    } finally {
        isLoading.value = false
    }
}

async function saveDocument() {
    isSaving.value = true
    error.value = null

    try {
        // Guardar en localStorage como solución temporal y backup
        const storageKey = getStorageKey()
        localStorage.setItem(storageKey, JSON.stringify(documentPages.value))

        // Obtener el attachment actual
        const cacheKey = `${entityType.value}-${entityId.value}`
        const attachment = attachmentsStore.attachments[cacheKey]

        if (!attachment || !attachment.id) {
            throw new Error('No se encontró el archivo adjunto para actualizar.')
        }

        // Enviar al backend para actualizar el .docx original
        await updateDocumentContent(attachment.id, documentPages.value)
    } catch (err: any) {
        console.error('Error al guardar documento:', err)
        error.value = err.message || 'Error al guardar el documento'
    } finally {
        isSaving.value = false
    }
}

function handleAutosavePages(pages: string[]) {
    const storageKey = getStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(pages))
}

// Lifecycle
onMounted(() => {
    loadDocument()
})
</script>

<style scoped>
.loading-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
}

.loading-spinner {
    background-color: white;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
}

.spinner {
    width: 4rem;
    height: 4rem;
    border: 4px solid #dbeafe;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error-banner {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 300px;
}

.error-icon {
    font-size: 1.25rem;
}

.close-error {
    margin-left: auto;
    color: #dc2626;
    font-weight: 700;
    cursor: pointer;
}

.close-error:hover {
    color: #991b1b;
}
</style>
