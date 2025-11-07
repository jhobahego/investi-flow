import axios from 'axios'
import { ENV } from '../config/env.config'
import { type ApiError, type ValidationErrorDetail, type ProcessedValidationError } from '../types'

// Clase personalizada para errores de validación
export class ApiValidationError extends Error {
  public validationErrors: Record<string, ProcessedValidationError>
  public fields: string[]

  constructor(validationErrors: Record<string, ProcessedValidationError>) {
    const messages = Object.values(validationErrors).map(err => err.errorMessage)
    super(messages.join(', '))

    this.name = 'ApiValidationError'
    this.validationErrors = validationErrors
    this.fields = Object.keys(validationErrors)
  }

  // Método para obtener el error de un campo específico
  getFieldError(field: string): { errorMessage: string; errorType: string; inputValue: any } | undefined {
    return this.validationErrors[field]
  }

  // Método para obtener el mensaje de error de un campo específico
  getFieldMessage(field: string): string | undefined {
    return this.validationErrors[field]?.errorMessage
  }

  // Método para obtener el primer error (útil cuando solo hay un campo con error)
  getFirstError(): { field: string; errorMessage: string; errorType: string; inputValue: any } | undefined {
    const firstField = this.fields[0]
    if (!firstField) return undefined

    return {
      field: firstField,
      ...this.validationErrors[firstField]
    }
  }

  // Método para verificar si un campo específico tiene errores
  hasFieldError(field: string): boolean {
    return field in this.validationErrors
  }
}

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Variable para controlar el proceso de refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  
  failedQueue = []
}

// Interceptor para añadir el token de autenticación a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Función para intentar refrescar el token
 */
async function attemptTokenRefresh(originalRequest: any): Promise<any> {
  if (isRefreshing) {
    // Si ya estamos refrescando, poner esta petición en cola
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then(token => {
      originalRequest.headers['Authorization'] = 'Bearer ' + token
      return apiClient(originalRequest)
    }).catch(err => {
      return Promise.reject(err)
    })
  }

  originalRequest._retry = true
  isRefreshing = true

  const refreshToken = localStorage.getItem('refreshToken')
  
  if (!refreshToken) {
    // No hay refresh token, redirigir al login
    isRefreshing = false
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
    const unauthorizedError = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
    unauthorizedError.name = 'UnauthorizedError'
    return Promise.reject(unauthorizedError)
  }

  try {
    // Intentar refrescar el token
    const { data } = await axios.post<{ access_token: string; refresh_token: string; token_type: string }>(
      `${ENV.API_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      }
    )

    // Guardar los nuevos tokens
    localStorage.setItem('accessToken', data.access_token)
    localStorage.setItem('refreshToken', data.refresh_token)
    
    // Actualizar el header de la petición original
    originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token
    
    // Procesar la cola de peticiones fallidas
    processQueue(null, data.access_token)
    
    isRefreshing = false
    
    // Reintentar la petición original
    return apiClient(originalRequest)
  } catch (refreshError) {
    // Si falla el refresh, limpiar todo y redirigir al login
    processQueue(refreshError, null)
    isRefreshing = false
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
    
    const unauthorizedError = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
    unauthorizedError.name = 'UnauthorizedError'
    return Promise.reject(unauthorizedError)
  }
}

// Interceptor para manejar errores de validación de FastAPI
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Manejar error 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Evitar intentar refrescar el token en rutas de auth
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh')) {
        const errorResponse: ApiError = error.response?.data
        const unauthorizedError = new Error(errorResponse.detail || 'No autorizado. Por favor, inicia sesión nuevamente.')
        unauthorizedError.name = 'UnauthorizedError'
        return Promise.reject(unauthorizedError)
      }

      // Verificar si el usuario ha estado inactivo
      const lastActivityTime = localStorage.getItem('lastActivityTime')
      const now = Date.now()
      const INACTIVITY_THRESHOLD = 30 * 60 * 1000 // 30 minutos
      
      const isInactive = lastActivityTime && (now - parseInt(lastActivityTime)) > INACTIVITY_THRESHOLD

      // Si el usuario ha estado inactivo, emitir evento para mostrar modal
      if (isInactive) {
        window.dispatchEvent(new CustomEvent('session-expiring', { 
          detail: { requiresConfirmation: true } 
        }))
        
        // Esperar la decisión del usuario
        return new Promise((resolve, reject) => {
          const handleContinue = () => {
            window.removeEventListener('session-continue', handleContinue)
            window.removeEventListener('session-cancel', handleCancel)
            // Continuar con el refresh normal
            attemptTokenRefresh(originalRequest).then(resolve).catch(reject)
          }
          
          const handleCancel = () => {
            window.removeEventListener('session-continue', handleContinue)
            window.removeEventListener('session-cancel', handleCancel)
            // Usuario decidió cerrar sesión
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
            reject(new Error('Sesión cancelada por el usuario'))
          }
          
          window.addEventListener('session-continue', handleContinue)
          window.addEventListener('session-cancel', handleCancel)
        })
      }

      // Refresh automático para usuarios activos
      return attemptTokenRefresh(originalRequest)
    }

    // Manejar errores de validación (422)
    if (error.response?.status === 422 && error.response.data?.detail) {
      // Se procesan los errores de validación de FastAPI
      const validationErrors: ValidationErrorDetail[] = error.response.data.detail

      const validationData = validationErrors.map((err) => {
        const { input: inputValue, loc, msg, type: errorType } = err
        const field = loc[loc.length - 1] as string
        const errorMessage = msg.replace('Value error, ', '')

        return {
          field,
          errorMessage,
          errorType,
          inputValue
        }
      })

      // Se crea un objeto de error detallado usando validationData
      const detailedErrors = validationData.reduce((acc, { field, errorMessage, errorType, inputValue }) => {
        acc[field] = {
          errorMessage,
          errorType,
          inputValue
        }
        return acc
      }, {} as Record<string, ProcessedValidationError>)

      // Crear y lanzar el error de validación personalizado
      const validationError = new ApiValidationError(detailedErrors)
      return Promise.reject(validationError)
    }

    // Para otros errores, asegurar que tengamos un Error object
    if (!(error instanceof Error)) {
      const errorMessage = error.response?.data?.detail || 'Ha ocurrido un error inesperado, por favor intenta de nuevo.'
      const newError = new Error(errorMessage)
      newError.name = 'APIError'
      return Promise.reject(newError)
    }

    return Promise.reject(error)
  }
)

export default apiClient