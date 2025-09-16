<template>
  <Modal :is-open="isOpen" @close="handleCancel" :title="title" size="sm">
    <div class="text-center">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
      </div>

      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {{ title }}
      </h3>

      <p class="text-sm text-gray-500 mb-6">
        {{ message }}
      </p>

      <div v-if="confirmText" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Para confirmar, escribe "<strong>{{ confirmText }}</strong>"
        </label>
        <input v-model="inputValue" type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
          :placeholder="confirmText" />
      </div>
    </div>

    <template #footer>
      <button type="button" @click="handleCancel"
        class="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
        Cancelar
      </button>
      <button @click="handleConfirm" :disabled="isConfirmDisabled || loading"
        class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <span>{{ confirmButtonText }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '¿Estás seguro?'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: null
  },
  confirmButtonText: {
    type: String,
    default: 'Confirmar'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const inputValue = ref('')

const isConfirmDisabled = computed(() => {
  if (!props.confirmText) return false
  return inputValue.value !== props.confirmText
})

const handleConfirm = () => {
  if (!isConfirmDisabled.value && !props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  inputValue.value = ''
  emit('cancel')
}

// Reset input when dialog opens/closes
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    inputValue.value = ''
  }
})
</script>