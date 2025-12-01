<template>
  <div class="animate-pulse">
    <div v-if="type === 'card'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div class="h-3 bg-gray-200 rounded w-5/6"></div>
      <div class="mt-4 flex items-center justify-between">
        <div class="h-6 bg-gray-200 rounded w-20"></div>
        <div class="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
    </div>

    <div v-else-if="type === 'list'" class="space-y-3">
      <div v-for="i in count" :key="i" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>

    <div v-else-if="type === 'text'" class="space-y-2">
      <div v-for="i in count" :key="i" class="h-4 bg-gray-200 rounded" :class="widthClass"></div>
    </div>

    <div v-else-if="type === 'phase-column'" class="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col">
      <!-- Phase header -->
      <div class="flex items-center justify-between mb-4">
        <div class="h-5 bg-gray-200 rounded w-32"></div>
        <div class="flex items-center space-x-2">
          <div class="h-6 bg-gray-200 rounded-full w-8"></div>
          <div class="h-5 bg-gray-200 rounded-full w-5"></div>
        </div>
      </div>
      
      <!-- Task cards skeleton -->
      <div class="space-y-3 flex-1">
        <div v-for="i in count" :key="i" class="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-2/3"></div>
          <div class="mt-2 flex items-center justify-between">
            <div class="h-4 bg-gray-100 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation list skeleton -->
    <div v-else-if="type === 'conversation'" class="space-y-2">
      <div v-for="i in count" :key="i" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div class="flex items-center justify-between">
          <div class="h-3 bg-gray-100 rounded w-20"></div>
          <div class="h-3 bg-gray-100 rounded w-16"></div>
        </div>
      </div>
    </div>

    <!-- Project card skeleton -->
    <div v-else-if="type === 'project-card'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1 mr-4">
          <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-100 rounded w-16 mt-2"></div>
        </div>
        <div class="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
      <div class="space-y-2 mb-4">
        <div class="h-3 bg-gray-200 rounded w-full"></div>
        <div class="h-3 bg-gray-200 rounded w-5/6"></div>
        <div class="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-gray-100">
        <div class="flex items-center space-x-2">
          <div class="h-6 w-6 bg-gray-200 rounded-full"></div>
          <div class="h-3 bg-gray-200 rounded w-20"></div>
        </div>
        <div class="h-3 bg-gray-100 rounded w-24"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'card' | 'list' | 'text' | 'phase-column' | 'conversation' | 'project-card'
  count?: number
  width?: 'full' | 'half' | 'quarter'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  count: 3,
  width: 'full'
})

const widthClass = computed(() => {
  const widths = {
    full: 'w-full',
    half: 'w-1/2',
    quarter: 'w-1/4'
  }
  return widths[props.width]
})
</script>
