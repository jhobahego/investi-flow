import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
// import HomePage from '../views/HomePage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterPage.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id',
    name: 'Project',
    component: () => import('../views/ProjectBoard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'SearchResults',
    component: () => import('../views/SearchResults.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/document/edit',
    name: 'DocumentEditor',
    component: () => import('../views/DocumentEditorView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Verificar si el token existe en localStorage
  const hasToken = !!localStorage.getItem('accessToken')
  
  // Si el store dice que no está autenticado pero hay token, sincronizar
  if (hasToken && !authStore.isAuthenticated) {
    authStore.token = localStorage.getItem('accessToken')
    authStore.refreshToken = localStorage.getItem('refreshToken')
  }
  
  // Si no hay token pero el store dice que sí, limpiar el store
  if (!hasToken && authStore.isAuthenticated) {
    authStore.token = null
    authStore.refreshToken = null
    authStore.user = null
  }

  // Si la ruta requiere autenticación y no hay token
  if (to.meta.requiresAuth && !hasToken) {
    next('/login')
    return
  }
  
  // Si va a login o register pero ya está autenticado, redirigir al dashboard
  // NOTA: El Home (/) está permitido para usuarios autenticados
  if ((to.name === 'Login' || to.name === 'Register') && hasToken) {
    next('/dashboard')
    return
  }

  next()
})

export default router