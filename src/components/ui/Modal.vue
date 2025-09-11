<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        :class="sizeClasses">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 v-if="title" class="text-lg leading-6 font-medium text-gray-900 mb-4">
                {{ title }}
              </h3>
              <div class="mt-2">
                <slot></slot>
              </div>
            </div>
          </div>
        </div>
        <div v-if="$slots.footer" class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

interface Emits {
  close: []
}

const props = withDefaults(defineProps < Props > (), {
  title: '',
  size: 'md'
})

const emit = defineEmits < Emits > ()
const $slots = useSlots()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl'
  }
  return sizes[props.size] || sizes.md
})

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>