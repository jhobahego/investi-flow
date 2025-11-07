<template>
    <div class="min-h-screen bg-gray-100">
        <div class="max-w-6xl mx-auto p-2 sm:p-4">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-sm mb-4 p-3 sm:p-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <button @click="goBack"
                        class="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm sm:text-base self-start"
                        type="button">
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span class="hidden sm:inline">Volver</span>
                    </button>

                    <div class="flex-1 min-w-0">
                        <h1 class="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                            {{ documentTitle }}
                        </h1>
                        <p class="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                            Proyecto: {{ projectName }}
                        </p>
                    </div>

                    <button @click="saveDocument" :disabled="isSaving"
                        class="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                        type="button">
                        <span v-if="isSaving" class="animate-spin">⏳</span>
                        <span v-else>💾</span>
                        <span class="hidden sm:inline">{{ isSaving ? 'Guardando...' : 'Guardar' }}</span>
                        <span class="sm:hidden">{{ isSaving ? '...' : 'Guardar' }}</span>
                    </button>
                </div>
            </div>

            <!-- Editor -->
            <div class="mb-4">
                <!-- Mensaje informativo -->
                <div
                    class="info-banner mb-4 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-blue-800">
                    <div class="flex items-start gap-2">
                        <svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong>Nota:</strong> El editor extrae automáticamente el contenido de archivos .docx
                            desde el servidor. Los cambios se guardan automáticamente cada 3 segundos en el
                            navegador.</span>
                    </div>
                </div>

                <PagedEditor :pages="documentPages" :project-id="projectId" :bibliography="bibliography"
                    :project-info="projectInfo" @update:pages="documentPages = $event" @save="handleAutosavePages" />
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useAttachmentsStore } from '../stores/attachments'
import PagedEditor from '../components/editor/PagedEditor.vue'
import { extractDocumentPages } from '../api/documentService'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const attachmentsStore = useAttachmentsStore()

// State
const documentPages = ref<string[]>(['<p></p>'])
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)

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

// Bibliography (from project)
const bibliography = computed(() => {
    // TODO: Fetch from bibliographies store when implemented
    return []
})

const projectInfo = computed(() => ({
    name: currentProject.value?.name,
    description: currentProject.value?.description,
    research_type: currentProject.value?.research_type
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
                    console.log('📄 Archivo:', pagesData.file_name)
                    console.log('📊 Tamaño:', (pagesData.file_size / 1024).toFixed(2), 'KB')
                    console.log('📄 Páginas:', pagesData.total_pages)

                    // Guardar en localStorage para acceso offline
                    const storageKey = getStorageKey()
                    localStorage.setItem(storageKey, JSON.stringify(pagesData.pages))

                    return
                }
            } catch (extractError: any) {
                if (extractError.response?.status === 400) {
                    // El archivo no es .docx o no se puede extraer
                    console.warn('⚠️ El documento no es .docx o no se puede extraer contenido')
                    console.warn('   Tipo de archivo:', document.file_type)
                } else if (extractError.response?.status === 404) {
                    console.warn('⚠️ Archivo no encontrado en el servidor')
                } else {
                    console.warn('⚠️ No se pudo extraer contenido del servidor:', extractError.message)
                }
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
            documentPages.value = [`<h1>${fileName}</h1><p>Comienza a escribir el contenido de tu documento aquí...</p><p><br></p><h2>Sección 1</h2><p>Escribe aquí el contenido de la primera sección.</p>`]
            console.log('📄 Plantilla creada con nombre del documento')
        } else {
            // 5. No hay documento, crear uno nuevo vacío
            documentPages.value = ['<h1>Nuevo Documento</h1><p>Comienza a escribir tu documento aquí...</p>']
            console.log('📝 Nuevo documento vacío creado')
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
        // Guardar en localStorage como solución temporal
        const storageKey = getStorageKey()
        localStorage.setItem(storageKey, JSON.stringify(documentPages.value))

        console.log('Documento guardado en localStorage:', {
            projectId: projectId.value,
            entityType: entityType.value,
            entityId: entityId.value,
            totalPages: documentPages.value.length
        })

        // TODO: Implementar guardado del contenido HTML en el backend
        // Cuando el backend esté listo, descomentar esto:
        /*
        const response = await apiClient.patch(
          `/documentos/${entityId.value}/content`,
          { pages: documentPages.value }
        )
        */

        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 300))

        // Mostrar mensaje de éxito en consola
        console.log('✓ Documento guardado exitosamente')
    } catch (err: any) {
        console.error('Error al guardar documento:', err)
        error.value = err.message || 'Error al guardar el documento'
    } finally {
        isSaving.value = false
    }
}

function handleAutosavePages(pages: string[]) {
    // Guardar automáticamente en localStorage
    const storageKey = getStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(pages))
    console.log('Autoguardado en localStorage:', pages.length, 'páginas')

    // TODO: Cuando el backend esté listo, enviar a la API aquí
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
