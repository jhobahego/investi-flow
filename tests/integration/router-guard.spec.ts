import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { routerHolder } = vi.hoisted(() => ({
  routerHolder: { current: null as Router | null },
}))

/**
 * Puente de inyección: el store auth real llama a useRouter() en su creación
 * (src/stores/auth.ts:13), lo cual exige contexto de componente. Se conserva
 * el módulo vue-router real y solo se devuelve el router real de cada test.
 * Mismo precedente que tests/unit/stores/auth.spec.ts.
 */
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => {
      if (!routerHolder.current) throw new Error('test router not installed')
      return routerHolder.current
    },
  }
})

const StubView = defineComponent({ template: '<div />' })

/**
 * Recorte documentado: rutas espejo de src/router/index.ts (mismos paths,
 * names y meta.requiresAuth) y guard copiado verbatim de
 * src/router/index.ts:58-91, pero sobre memory history y con vistas stub
 * (las vistas lazy reales exigirían infraestructura de app completa).
 * Router, guard y store auth son reales; nada interno está simulado.
 */
function createGuardedRouter(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: StubView },
      { path: '/login', name: 'Login', component: StubView },
      { path: '/register', name: 'Register', component: StubView },
      { path: '/dashboard', name: 'Dashboard', component: StubView, meta: { requiresAuth: true } },
      { path: '/search', name: 'SearchResults', component: StubView, meta: { requiresAuth: true } },
    ],
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
    if ((to.name === 'Login' || to.name === 'Register') && hasToken) {
      next('/dashboard')
      return
    }

    next()
  })

  return router
}

describe('router auth guard integration (router + auth store)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    routerHolder.current = null
  })

  it('redirects to login when accessing a protected route without a token', async () => {
    // Arrange
    const router = createGuardedRouter()
    routerHolder.current = router

    // Act
    await router.push('/dashboard')

    // Assert
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows access to a protected route when a token exists', async () => {
    // Arrange
    localStorage.setItem('accessToken', 'valid-access-token')
    localStorage.setItem('refreshToken', 'valid-refresh-token')
    const router = createGuardedRouter()
    routerHolder.current = router

    // Act
    await router.push('/dashboard')

    // Assert
    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(useAuthStore().isAuthenticated).toBe(true)
  })

  it('redirects authenticated users away from login to the dashboard', async () => {
    // Arrange
    localStorage.setItem('accessToken', 'valid-access-token')
    const router = createGuardedRouter()
    routerHolder.current = router

    // Act
    await router.push('/login')

    // Assert
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})
