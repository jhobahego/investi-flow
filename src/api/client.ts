import axios from 'axios'
import { ENV } from '../config/env.config'

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
      // Procesar errores de validación de FastAPI
      const validationErrors = error.response.data.detail
      const errorMessages = validationErrors.map((err: any) => {
        const field = err.loc[err.loc.length - 1] // Último elemento de loc
        const message = err.msg.replace('Value error, ', '') // Limpiar prefijo
        return `${field}: ${message}`
      })
      
      // Crear un nuevo error con mensaje procesado
      const processedError = new Error(errorMessages.join(', '))
      return Promise.reject(processedError)
    }
    return Promise.reject(error)
  }
)

export default apiClient
