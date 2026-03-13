<template>
  <Modal :isOpen="show" title="Agregar Bibliografía" @close="$emit('close')">
    <div class="p-4">
      <!-- Tabs -->
      <div class="flex border-b border-gray-200 mb-4">
        <button @click="activeTab = 'manual'"
          :class="['px-4 py-2 font-medium text-sm focus:outline-none', activeTab === 'manual' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700']">
          Entrada Manual
        </button>
        <button @click="activeTab = 'search'"
          :class="['px-4 py-2 font-medium text-sm focus:outline-none', activeTab === 'search' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700']">
          Buscar Fuentes (IA)
        </button>
      </div>

      <!-- Manual Entry Form -->
      <div v-if="activeTab === 'manual'">
        <form @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tipo de Fuente</label>
              <select v-model="form.type"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                <option value="libro">Libro</option>
                <option value="articulo">Artículo de Revista</option>
                <option value="web">Sitio Web</option>
                <option value="tesis">Tesis</option>
                <option value="capitulo">Capítulo de Libro</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Título</label>
              <input type="text" v-model="form.title" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Autores</label>
              <input type="text" v-model="form.author" required placeholder="Ej: García, M. & López, A."
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
              <p class="text-xs text-gray-500 mt-1">Formato APA: Apellido, Inicial.</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Año</label>
                <input type="number" v-model="form.year"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Fuente / Editorial</label>
                <input type="text" v-model="form.source"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
              </div>
            </div>

            <div v-if="form.type === 'articulo'" class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Volumen</label>
                <input type="text" v-model="form.volume"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Número</label>
                <input type="text" v-model="form.issue"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Páginas</label>
                <input type="text" v-model="form.pages"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">DOI / URL</label>
              <input type="text" v-model="form.doi" placeholder="DOI o URL"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Documento (PDF/DOCX)</label>
              <input type="file" @change="handleFileChange" accept=".pdf,.docx"
                class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Search Tab -->
      <div v-else class="space-y-4">
        <div class="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-sm text-gray-600 mb-3">
            La IA analizará el contenido de tu documento y el contexto del proyecto para encontrar fuentes relevantes
            automáticamente.
          </p>
          <button @click="handleSearch" :disabled="isSearching"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors">
            <svg v-if="isSearching" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <svg v-else class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {{ isSearching ? 'Analizando y buscando...' : 'Buscar Bibliografía Recomendada' }}
          </button>
        </div>

        <div v-if="searchError" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ searchError }}
        </div>

        <div v-if="searchResults.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="(result, index) in searchResults" :key="index"
            class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium text-gray-900">{{ result.titulo }}</h4>
                <p class="text-sm text-gray-600">{{ result.autores.join(', ') }} ({{ result.anio || 's.f.' }})</p>
                <p class="text-xs text-gray-500 italic">{{ result.fuente }}</p>
                <div class="mt-1 flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {{ result.tipo }}
                  </span>
                  <span class="text-xs text-gray-500">Relevancia: {{ result.relevancia }}/5</span>
                  <a v-if="result.url" :href="result.url" target="_blank"
                    class="text-xs text-primary-600 hover:underline flex items-center gap-1 ml-2">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver Fuente
                  </a>
                </div>
                <p class="text-xs text-gray-600 mt-2 line-clamp-2">{{ result.resumen }}</p>
              </div>
              <button @click="selectSource(result)"
                class="ml-2 px-3 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-full hover:bg-primary-100">
                Seleccionar
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="!isSearching && hasSearched" class="text-center py-8 text-gray-500">
          No se encontraron resultados relevantes para el contexto actual.
        </div>

        <div v-else-if="!isSearching && !hasSearched" class="text-center py-8 text-gray-500">
          <p class="text-xs mt-2">La búsqueda utiliza IA para encontrar libros, artículos y tesis relacionados con tu
            investigación.</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import Modal from '../ui/Modal.vue'
import { aiService } from '../../api/aiService'
import type { BibliographyCreate, BibliographySource } from '../../types'

const props = defineProps<{
  show: boolean
  loading?: boolean
  projectId: number
  projectInfo?: {
    name?: string
    description?: string
    research_type?: string
  }
  documentContext?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: BibliographyCreate, file: File | null): void
}>()

const activeTab = ref<'manual' | 'search'>('manual')
const selectedFile = ref<File | null>(null)

// Search state
const isSearching = ref(false)
const searchResults = ref<BibliographySource[]>([])
const searchError = ref<string | null>(null)
const hasSearched = ref(false)

const form = reactive<BibliographyCreate>({
  type: 'libro',
  title: '',
  author: '',
  year: new Date().getFullYear(),
  source: '',
  doi: '',
  volume: '',
  issue: '',
  pages: ''
})

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

function handleSubmit() {
  emit('save', { ...form }, selectedFile.value)
  // Reset form logic could go here
}

async function handleSearch() {
  isSearching.value = true
  searchError.value = null
  searchResults.value = []
  hasSearched.value = true

  try {
    const projName = props.projectInfo?.name || 'investigación actual'
    const projDesc = props.projectInfo?.description || ''
    const projType = props.projectInfo?.research_type || ''
    const docTitle = props.projectInfo?.name || ''

    // Construir query automática estructurada basada en el contexto
    let query = `Documentos académicos, artículos científicos y tesis sobre el tema: "${projName}".`
    if (docTitle) {
      query += ` En específico para el documento titulado: "${docTitle}".`
    }
    if (projDesc) {
      query += ` Enfoque de la investigación: ${projDesc}.`
    }
    if (projType) {
      query += ` Tipo de investigación: ${projType}.`
    }
    query += ` Busco referencias bibliográficas específicas con enlaces directos al documento.`

    // Asegurar que enviamos un project_context completo y sin valores undefined que puedan romper el json
    const projectContext = {
      name: projName,
      description: projDesc,
      research_type: projType,
      document_title: docTitle
    };

    const response = await aiService.searchBibliography(props.projectId, {
      query: query,
      max_results: 5,
      project_context: projectContext,
      search_context: props.documentContext
    })
    searchResults.value = response.sources
  } catch (error: any) {
    console.error('Error searching bibliography:', error)
    searchError.value = error.response?.data?.detail?.message || 'Error al buscar bibliografía. Intenta nuevamente.'
  } finally {
    isSearching.value = false
  }
}

function selectSource(source: BibliographySource) {
  // Map source to form
  form.title = source.titulo
  form.author = source.autores.join(', ') // Simple join, user can edit
  form.year = source.anio || new Date().getFullYear()
  form.type = mapSourceType(source.tipo)
  form.source = source.fuente
  form.doi = source.doi || source.url || ''

  // Switch to manual tab for review/editing
  activeTab.value = 'manual'
}

function mapSourceType(apiType: string): string {
  const map: Record<string, string> = {
    'articulo': 'articulo',
    'libro': 'libro',
    'tesis': 'tesis',
    'web': 'web',
    'capitulo': 'capitulo'
  }
  return map[apiType.toLowerCase()] || 'libro'
}
</script>
