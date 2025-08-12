<template>
  <div class="flex items-center space-x-2">
    <div class="relative">
      <div class="w-10 h-10 bg-gradient-to-br from-secondary-400 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
        <div class="w-6 h-6 text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" class="animate-bounce-subtle">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      </div>
      <div v-if="isActive" class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
    </div>
    <div v-if="showName" class="flex flex-col">
      <span class="text-sm font-medium text-gray-900">Lexi</span>
      <span class="text-xs text-gray-500">Asistente de IA</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  showName: {
    type: Boolean,
    default: true
  }
})
</script>