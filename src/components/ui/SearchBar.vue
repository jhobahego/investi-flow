<template>
  <div class="relative max-w-md w-full">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input v-model="searchQuery" @keyup.enter="handleSearch" type="text" :placeholder="placeholder"
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
      <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button @click="clearSearch" class="text-gray-400 hover:text-gray-600 focus:outline-none">
          <XMarkIcon class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  initialValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Buscar proyectos...'
  }
})

const router = useRouter()
const searchQuery = ref('')

// Debounced search function
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const performSearch = (query: string) => {
  if (query.trim()) {
    router.push({
      name: 'SearchResults',
      query: { q: query.trim() }
    })
  }
}

const handleSearch = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  performSearch(searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Watch for changes in search query with debounce
watch(searchQuery, (newQuery) => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  if (newQuery.trim()) {
    debounceTimeout = setTimeout(() => {
      // Optional: Auto-search while typing (uncomment if desired)
      // performSearch(newQuery)
    }, 300)
  }
})

// Initialize with initial value
onMounted(() => {
  if (props.initialValue) {
    searchQuery.value = props.initialValue
  }
})
</script>