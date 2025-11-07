<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        @click.self="onCancel"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <!-- Icono de advertencia -->
          <div class="flex items-center justify-center mb-4">
            <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <!-- Título -->
          <h3 id="modal-title" class="text-xl font-bold text-gray-900 text-center mb-2">
            Tu sesión está por expirar
          </h3>

          <!-- Mensaje -->
          <p class="text-gray-600 text-center mb-6">
            Has estado inactivo durante un tiempo. Tu sesión expirará en
            <span class="font-bold text-primary-600">{{ countdown }}</span> segundos.
          </p>

          <!-- Información adicional -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p class="text-sm text-blue-800">
              <strong>💡 Consejo:</strong> Haz clic en "Continuar Sesión" para seguir trabajando sin interrupciones.
            </p>
          </div>

          <!-- Botones de acción -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="onContinue"
              class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Continuar Sesión
            </button>
            <button
              @click="onCancel"
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cerrar Sesión
            </button>
          </div>

          <!-- Barra de progreso -->
          <div class="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              class="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 h-full transition-all duration-1000 ease-linear"
              :style="{ width: progressWidth + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

interface Props {
  show: boolean
  initialCountdown?: number
}

interface Emits {
  (e: 'continue'): void
  (e: 'cancel'): void
  (e: 'expired'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialCountdown: 60
})

const emit = defineEmits<Emits>()

const countdown = ref(props.initialCountdown)
const countdownInterval = ref<number | undefined>()

// Progreso visual (100% a 0%)
const progressWidth = computed(() => {
  return (countdown.value / props.initialCountdown) * 100
})

const startCountdown = () => {
  countdown.value = props.initialCountdown
  
  countdownInterval.value = window.setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      stopCountdown()
      emit('expired')
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = undefined
  }
}

const onContinue = () => {
  stopCountdown()
  emit('continue')
}

const onCancel = () => {
  stopCountdown()
  emit('cancel')
}

// Watch para iniciar/detener el contador cuando cambia show
watch(() => props.show, (newShow) => {
  if (newShow) {
    startCountdown()
  } else {
    stopCountdown()
  }
}, { immediate: true })

// Limpiar al desmontar
onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white {
  transform: scale(0.9);
}

.modal-leave-to .bg-white {
  transform: scale(0.9);
}
</style>
