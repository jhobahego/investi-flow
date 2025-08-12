import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authenticateUser, getCurrentUser } from '../data/mockData'
import type { User, RegisterFormData } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(getCurrentUser())

  const isAuthenticated = computed(() => !!user.value)

  const login = async (email: string, password: string): Promise<boolean> => {
    const authenticatedUser = authenticateUser(email, password)
    if (authenticatedUser) {
      user.value = authenticatedUser
      return true
    }
    return false
  }

  const logout = (): void => {
    user.value = null
    localStorage.removeItem('investiflow_user')
  }

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    // Simulate registration - in real app, this would call an API
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      institution: userData.institution,
      role: userData.role as User['role'],
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    }
    localStorage.setItem('investiflow_user', JSON.stringify(newUser))
    user.value = newUser
    return true
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    register
  }
})