<template>
  <div class="bg-white rounded-lg shadow-sm h-full flex flex-col">
    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-900">Bibliografía</h2>
      <button @click="showAddModal = true" class="p-1 rounded-full hover:bg-gray-100 text-primary-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="loading" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="bibliographies.length === 0" class="text-center py-8 text-gray-500">
        <p>No hay bibliografía agregada.</p>
        <button @click="showAddModal = true" class="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
          Agregar primera fuente
        </button>
      </div>

      <div v-else v-for="bib in bibliographies" :key="bib.id"
        class="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-medium text-gray-900">{{ bib.title }}</h3>
            <p class="text-sm text-gray-600">{{ bib.author }} ({{ bib.year }})</p>
            <p class="text-xs text-gray-500 mt-1 italic">{{ bib.source }}</p>
          </div>
          <button @click="confirmDelete(bib.id)" class="text-gray-400 hover:text-red-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <div class="mt-2 flex gap-2">
          <a v-if="bib.url || bib.doi" :href="bib.url || `https://doi.org/${bib.doi}`" target="_blank"
            class="text-xs text-primary-600 hover:underline flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver Fuente
          </a>
          <span v-if="bib.file_name" class="text-xs text-gray-500 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {{ bib.file_name }}
          </span>
        </div>
      </div>
    </div>

    <AddBibliographyModal :show="showAddModal" :loading="saving" :project-id="projectId" :project-info="projectInfo"
      :document-context="documentContext" @close="showAddModal = false" @save="handleSave" />

    <ConfirmDialog :is-open="showDeleteConfirm" title="Eliminar Bibliografía"
      message="¿Estás seguro de que deseas eliminar esta referencia bibliográfica? Esta acción no se puede deshacer."
      confirm-button-text="Eliminar" :loading="deleting" @confirm="handleDelete" @cancel="showDeleteConfirm = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useBibliographyStore } from '../../stores/bibliography'
import AddBibliographyModal from './AddBibliographyModal.vue'
import ConfirmDialog from '../ui/ConfirmDialog.vue'
import type { BibliographyCreate } from '../../types'

const props = defineProps<{
  projectId: number
  projectInfo?: {
    name?: string
    description?: string
    research_type?: string
  }
  documentContext?: string
}>()

const store = useBibliographyStore()
const { bibliographies, loading } = storeToRefs(store)

const showAddModal = ref(false)
const saving = ref(false)

// Delete confirmation state
const showDeleteConfirm = ref(false)
const bibliographyToDelete = ref<number | null>(null)
const deleting = ref(false)

onMounted(() => {
  store.fetchBibliographies(props.projectId)
})

async function handleSave(data: BibliographyCreate, file: File | null) {
  saving.value = true
  try {
    const newBib = await store.createBibliography(props.projectId, data)
    if (file) {
      await store.uploadBibliographyDocument(props.projectId, newBib.id, file)
    }
    showAddModal.value = false
  } catch (error) {
    console.error('Error saving bibliography:', error)
  } finally {
    saving.value = false
  }
}

function confirmDelete(id: number) {
  bibliographyToDelete.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!bibliographyToDelete.value) return

  deleting.value = true
  try {
    await store.deleteBibliography(props.projectId, bibliographyToDelete.value)
    showDeleteConfirm.value = false
    bibliographyToDelete.value = null
  } catch (error) {
    console.error('Error deleting bibliography:', error)
  } finally {
    deleting.value = false
  }
}
</script>
