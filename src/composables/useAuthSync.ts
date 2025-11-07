import { onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

/**
 * Composable para sincronizar el estado de autenticación con localStorage
 * y detectar cambios en tiempo real (útil para tabs múltiples)
 */
export function useAuthSync() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Función para sincronizar el estado desde localStorage
  const syncAuthState = () => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    // Si hay tokens en localStorage pero no en el store, sincronizar
    if (accessToken && !authStore.token) {
      authStore.token = accessToken
      authStore.refreshToken = refreshToken
      
      // Intentar cargar el usuario si aún no está cargado
      if (!authStore.user) {
        authStore.fetchUser().catch(() => {
          // Si falla, limpiar el estado
          authStore.token = null
          authStore.refreshToken = null
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        })
      }
    }
    
    // Si no hay tokens en localStorage pero sí en el store, limpiar el store
    if (!accessToken && authStore.token) {
      authStore.token = null
      authStore.refreshToken = null
      authStore.user = null
    }
  }

  // Listener para detectar cambios en localStorage (útil para múltiples pestañas)
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'accessToken' || event.key === 'refreshToken') {
      syncAuthState()
      
      // Si se eliminó el token de acceso, redirigir al login si estamos en ruta protegida
      if (event.key === 'accessToken' && !event.newValue) {
        const currentRoute = router.currentRoute.value
        if (currentRoute.meta.requiresAuth) {
          router.push({ name: 'Login' })
        }
      }
    }
  }

  // Vigilar cambios en isAuthenticated para actualizar la UI
  watch(() => authStore.isAuthenticated, (isAuth, wasAuth) => {
    // Si perdió la autenticación, verificar si está en ruta protegida
    if (wasAuth && !isAuth) {
      const currentRoute = router.currentRoute.value
      if (currentRoute.meta.requiresAuth) {
        router.push({ name: 'Login' })
      }
    }
  })

  onMounted(() => {
    // Sincronizar al montar
    syncAuthState()
    
    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
  })

  return {
    syncAuthState
  }
}
