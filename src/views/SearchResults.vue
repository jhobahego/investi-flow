<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header with Back Button and Search -->
      <div class="mb-8">
        <div class="flex items-center space-x-4 mb-4">
          <button @click="goBack"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            Volver
          </button>

          <div class="flex-1 max-w-md">
            <SearchBar :initial-value="searchQuery" placeholder="Buscar proyectos..." />
          </div>
        </div>

        <h1 class="text-3xl font-bold text-gray-900">Resultados de Búsqueda</h1>
        <p v-if="searchQuery" class="mt-2 text-lg text-gray-600">
          Mostrando resultados para: <span class="font-semibold">"{{ searchQuery }}"</span>
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="searchStore.isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span class="ml-3 text-lg text-gray-600">Buscando proyectos...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="searchStore.error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error en la búsqueda</h3>
            <p class="mt-2 text-sm text-red-700">{{ searchStore.error }}</p>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-else-if="!searchStore.isLoading">
        <!-- No Results -->
        <div v-if="searchStore.results.length === 0 && searchQuery" class="text-center py-12">
          <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No se encontraron proyectos</h3>
          <p class="mt-1 text-sm text-gray-500">
            No pudimos encontrar proyectos que coincidan con tu búsqueda.
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Intenta con diferentes palabras clave o revisa la ortografía.
          </p>
        </div>

        <!-- Results Grid -->
        <div v-else class="space-y-6">
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              {{ searchStore.results.length }} proyecto{{ searchStore.results.length !== 1 ? 's' : '' }} encontrado{{
                searchStore.results.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ProjectResultCard v-for="project in searchStore.results" :key="project.id" :project="project" />
          </div>
        </div>
      </div>

      <!-- Empty State (no search query) -->
      <div v-if="!searchQuery && !searchStore.isLoading" class="text-center py-12">
        <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Realiza una búsqueda</h3>
        <p class="mt-1 text-sm text-gray-500">
          Usa la barra de búsqueda para encontrar proyectos.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '../stores/search'
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import ProjectResultCard from '../components/ui/ProjectResultCard.vue'
import SearchBar from '../components/ui/SearchBar.vue'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

const searchQuery = computed(() => {
  const query = route.query.q
  return typeof query === 'string' ? query : ''
})

// Watch for changes in the search query
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery && typeof newQuery === 'string') {
      searchStore.searchProjects(newQuery)
    } else {
      searchStore.clearResults()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Perform search if there's a query on mount
  if (searchQuery.value) {
    searchStore.searchProjects(searchQuery.value)
  }
})

const goBack = () => {
  router.go(-1)
}
</script>