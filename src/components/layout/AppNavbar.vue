<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo y Nombre -->
        <router-link to="/" class="flex items-center space-x-2 flex-shrink-0">
          <div
            class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">IF</span>
          </div>
          <span class="text-xl font-bold text-gray-900 hidden sm:block">InvestiFlow</span>
        </router-link>

        <!-- Search Bar - Desktop/Tablet (centrado con flex-grow) -->
        <div class="hidden md:flex flex-1 justify-center px-4" v-if="isAuthenticated">
          <SearchBar class="max-w-md w-full" />
        </div>

        <!-- Menu Desktop - cuando está autenticado -->
        <div class="hidden md:flex items-center space-x-2 lg:space-x-4" v-if="isAuthenticated">
          <router-link to="/dashboard"
            class="text-gray-700 hover:text-primary-600 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
            Dashboard
          </router-link>

          <div class="relative" ref="userMenuRef">
            <button @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-1 lg:space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none">
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-sm">
                  {{ user?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
                </span>
              </div>
              <!-- Mostrar solo en pantallas grandes -->
              <span class="text-sm font-medium hidden lg:inline truncate max-w-[120px]">
                {{ user?.full_name || 'Usuario' }}
              </span>
              <ChevronDownIcon class="w-4 h-4 flex-shrink-0" />
            </button>

            <div v-show="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <!-- Mostrar nombre completo en el menú -->
              <div class="px-4 py-2 border-b border-gray-200 lg:hidden">
                <p class="text-sm font-medium text-gray-900 truncate">{{ user?.full_name || 'Usuario' }}</p>
                <p class="text-xs text-gray-500 truncate">{{ user?.email || '' }}</p>
              </div>
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Mi Perfil
              </a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Configuración
              </a>
              <hr class="my-1">
              <button @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <!-- Botones cuando no está autenticado - Desktop -->
        <div class="hidden md:flex items-center space-x-4" v-else>
          <router-link to="/login"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
            Iniciar Sesión
          </router-link>
          <router-link to="/register"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Registrarse
          </router-link>
        </div>

        <!-- Mobile Menu Button -->
        <button @click="showMobileMenu = !showMobileMenu"
          class="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none"
          v-if="isAuthenticated">
          <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6" />
          <XMarkIcon v-else class="w-6 h-6" />
        </button>
      </div>

      <!-- Mobile Menu -->
      <div v-if="showMobileMenu && isAuthenticated" class="md:hidden border-t border-gray-200 py-2">
        <!-- Search Bar Mobile -->
        <div class="px-2 py-2">
          <SearchBar />
        </div>

        <!-- Navigation Links Mobile -->
        <div class="space-y-1 px-2 py-2">
          <router-link to="/dashboard" @click="showMobileMenu = false"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
            Dashboard
          </router-link>
        </div>

        <!-- User Info Mobile -->
        <div class="border-t border-gray-200 px-2 py-3">
          <div class="flex items-center space-x-3 px-3 py-2">
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold">
                {{ user?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ user?.full_name || 'Usuario' }}</p>
              <p class="text-xs text-gray-500 truncate">{{ user?.email || '' }}</p>
            </div>
          </div>

          <div class="mt-2 space-y-1">
            <a href="#" class="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Mi Perfil
            </a>
            <a href="#" class="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Configuración
            </a>
            <button @click="handleLogout"
              class="block w-full text-left px-3 py-2 rounded-md text-sm text-red-700 hover:bg-red-50">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import SearchBar from '../ui/SearchBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const userMenuRef = ref(null)

const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleLogout = () => {
  authStore.logout()
  showUserMenu.value = false
  showMobileMenu.value = false
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