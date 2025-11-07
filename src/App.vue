<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAuthSync } from './composables/useAuthSync'
import { useActivityDetector } from './composables/useActivityDetector'
import SessionExpirationModal from './components/ui/SessionExpirationModal.vue'

const authStore = useAuthStore()
// Usar el composable para sincronizar el estado de autenticación
useAuthSync()

// Detectar actividad del usuario
const { updateActivity } = useActivityDetector()

// Estado del modal de expiración
const showExpirationModal = ref(false)

// Manejar evento de sesión por expirar
const handleSessionExpiring = (event: CustomEvent) => {
  if (event.detail.requiresConfirmation) {
    showExpirationModal.value = true
  }
}

// Usuario decide continuar
const handleContinueSession = () => {
  showExpirationModal.value = false
  updateActivity() // Actualizar actividad
  window.dispatchEvent(new Event('session-continue'))
}

// Usuario decide cerrar sesión
const handleCancelSession = () => {
  showExpirationModal.value = false
  window.dispatchEvent(new Event('session-cancel'))
}

// Sesión expiró (contador llegó a 0)
const handleSessionExpired = () => {
  showExpirationModal.value = false
  authStore.logout()
}

onMounted(() => {
  authStore.checkAuth()
  
  // Inicializar el tiempo de última actividad
  updateActivity()
  
  // Escuchar eventos de sesión
  window.addEventListener('session-expiring', handleSessionExpiring as EventListener)
})
</script>

<template>
  <div id="app">
    <router-view />
    
    <!-- Modal de expiración de sesión -->
    <SessionExpirationModal
      :show="showExpirationModal"
      :initial-countdown="60"
      @continue="handleContinueSession"
      @cancel="handleCancelSession"
      @expired="handleSessionExpired"
    />
  </div>
</template>

<style>
html, body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #f9fafb;
}

#app {
  min-height: 100vh;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(10px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-bounce-subtle {
  animation: bounceSubtle 2s infinite;
}
</style>