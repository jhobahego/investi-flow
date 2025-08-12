<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">IF</span>
            </div>
            <span class="text-xl font-bold text-gray-900">InvestiFlow</span>
          </router-link>
        </div>
        
        <div class="flex items-center space-x-4" v-if="isAuthenticated">
          <router-link 
            to="/dashboard" 
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Dashboard
          </router-link>
          
          <div class="relative" ref="userMenuRef">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              <img 
                :src="user.avatar" 
                :alt="user.name"
                class="w-8 h-8 rounded-full object-cover"
              >
              <span class="text-sm font-medium">{{ user.name }}</span>
              <ChevronDownIcon class="w-4 h-4" />
            </button>
            
            <div
              v-show="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Mi Perfil
              </a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Configuración
              </a>
              <hr class="my-1">
              <button
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-4" v-else>
          <router-link 
            to="/login"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Iniciar Sesión
          </router-link>
          <router-link 
            to="/register"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Registrarse
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)
const userMenuRef = ref(null)

const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>