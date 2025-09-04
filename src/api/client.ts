import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // Asegúrate de que esta sea la URL correcta de tu backend
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

export default apiClient
