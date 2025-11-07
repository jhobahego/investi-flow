import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable para detectar actividad del usuario
 * Rastrea mouse, teclado, scroll, clicks, etc.
 */
export function useActivityDetector() {
  const lastActivityTime = ref<number>(Date.now())
  const isIdle = ref<boolean>(false)
  
  // Tiempo de inactividad en milisegundos (30 minutos)
  const IDLE_TIMEOUT = 30 * 60 * 1000

  const updateActivity = () => {
    const now = Date.now()
    lastActivityTime.value = now
    localStorage.setItem('lastActivityTime', now.toString())
    isIdle.value = false
  }

  const checkIdleStatus = () => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityTime.value
    
    if (timeSinceLastActivity >= IDLE_TIMEOUT) {
      isIdle.value = true
    }
  }

  // Eventos que consideramos como "actividad"
  const events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]

  let idleCheckInterval: number | undefined

  onMounted(() => {
    // Registrar listeners para todos los eventos
    events.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    // Verificar estado de inactividad cada minuto
    idleCheckInterval = window.setInterval(checkIdleStatus, 60000)
  })

  onUnmounted(() => {
    // Limpiar listeners
    events.forEach(event => {
      window.removeEventListener(event, updateActivity)
    })

    if (idleCheckInterval) {
      clearInterval(idleCheckInterval)
    }
  })

  /**
   * Obtiene el tiempo de inactividad en minutos
   */
  const getIdleTimeMinutes = (): number => {
    const now = Date.now()
    const idleMs = now - lastActivityTime.value
    return Math.floor(idleMs / 60000)
  }

  return {
    lastActivityTime,
    isIdle,
    getIdleTimeMinutes,
    updateActivity
  }
}
