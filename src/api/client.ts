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

// Interceptor para manejar errores de validación de FastAPI
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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

    if (error.response?.status === 401) {
      const errorResponse: ApiError = error.response?.data

      const unauthorizedError = new Error(errorResponse.detail || 'No autorizado. Por favor, inicia sesión nuevamente.')
      unauthorizedError.name = 'UnauthorizedError'
      return Promise.reject(unauthorizedError)
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