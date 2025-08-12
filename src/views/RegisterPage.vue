<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">IF</span>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
          Crea tu cuenta
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500 ml-1">
            inicia sesión si ya tienes cuenta
          </router-link>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              v-model="form.name"
              class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Tu nombre completo"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              v-model="form.email"
              class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label for="institution" class="block text-sm font-medium text-gray-700 mb-1">
              Institución
            </label>
            <input
              id="institution"
              name="institution"
              type="text"
              required
              v-model="form.institution"
              class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Universidad o institución"
            />
          </div>
          
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              id="role"
              name="role"
              required
              v-model="form.role"
              class="relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            >
              <option value="">Selecciona tu rol</option>
              <option value="student">Estudiante</option>
              <option value="researcher">Investigador</option>
              <option value="professor">Profesor</option>
              <option value="other">Otro</option>
            </select>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              v-model="form.password"
              class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              v-model="form.confirmPassword"
              class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Confirma tu contraseña"
            />
          </div>
        </div>
        
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            v-model="form.acceptTerms"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="terms" class="ml-2 block text-sm text-gray-900">
            Acepto los 
            <a href="#" class="text-primary-600 hover:text-primary-500">Términos y Condiciones</a>
            y la
            <a href="#" class="text-primary-600 hover:text-primary-500">Política de Privacidad</a>
          </label>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="!loading">Crear Cuenta</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando cuenta...
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  institution: '',
  role: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const handleRegister = async () => {
  error.value = ''
  
  if (form.password !== form.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  
  if (form.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  
  if (!form.acceptTerms) {
    error.value = 'Debes aceptar los términos y condiciones'
    return
  }
  
  loading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
    
    const success = await authStore.register({
      name: form.name,
      email: form.email,
      institution: form.institution,
      role: form.role,
      password: form.password
    })
    
    if (success) {
      router.push('/dashboard')
    } else {
      error.value = 'Error al crear la cuenta. Por favor, intenta nuevamente.'
    }
  } catch (err) {
    error.value = 'Error al crear la cuenta. Por favor, intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>