import axios from 'axios'
import { ENV } from '../config/env.config'
import { AuthorizationError, ValidationErrorResponse } from '../types'

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
      const validationErrors: ValidationErrorResponse = error.response.data
      const validationData = validationErrors.detail.map((err) => {
        const { input: inputValue, loc, msg, type: errorType } = err
        const field = loc[loc.length - 1]
        const errorMessage = msg.replace('Value error, ', `${field}: `)

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
      }, {} as Record<string, { errorMessage: string; errorType: string; inputValue: any }>)

      const processedError = new Error(Object.values(detailedErrors).map(err => err.errorMessage).join(', '))
      processedError.name = 'ValidationError'
      return Promise.reject(processedError)
    }

    if (error.response?.status === 401) {
      const errorResponse: AuthorizationError = error.response?.data

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
