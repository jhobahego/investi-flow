import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../api/client'
import type { User, UserCreatePayload, TokenResponse, LoginFormData } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)

  function setAuthData(
    userData: User | null,
    accessToken: string | null
  ) {
    user.value = userData
    token.value = accessToken
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken)
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } else {
      localStorage.removeItem('accessToken')
      delete apiClient.defaults.headers.common['Authorization']
    }
  }

  async function register(payload: UserCreatePayload) {
    try {
      await apiClient.post('/auth/register', payload)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  async function login(credentials: LoginFormData) {
    try {
      const formData = new FormData()
      formData.append('username', credentials.email)
      formData.append('password', credentials.password)

      const { data } = await apiClient.post<TokenResponse>(
        '/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      setAuthData(null, data.access_token)
      await fetchUser()
      router.push({ name: 'Dashboard' })
    } catch (error) {
      console.error('Login failed:', error)
      setAuthData(null, null)
      throw error
    }
  }

  async function logout() {
    setAuthData(null, null)
    router.push({ name: 'Login' })
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      // HACK: Assuming a /users/me endpoint exists.
      // This needs to be created in the backend.
      const { data } = await apiClient.get<User>('/users/me')
      user.value = data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // If fetching user fails, token might be invalid
      setAuthData(null, null)
    }
  }

  async function checkAuth() {
    if (token.value) {
      await fetchUser()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    logout,
    checkAuth,
    fetchUser
  }
})