import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import SearchBar from '@/components/ui/SearchBar.vue'
import { useSearchStore } from '@/stores/search'
import SearchResults from '@/views/SearchResults.vue'
import { server } from '../mocks/server'
import { searchEmptyHandler, searchServerErrorHandler, searchUnauthorizedHandler } from '../mocks/handlers'

const StubView = defineComponent({ template: '<div />' })

/**
 * Recorte documentado: se usa un router real con memory history y las mismas
 * rutas que src/router/index.ts (/search como SearchResults protegida y
 * /project/:id para los router-link de ProjectResultCard), pero con
 * componentes stub salvo SearchResults, sin el guard de autenticación
 * (cubierto en tests/integration/router-guard.spec.ts) y sin el resto de
 * vistas pesadas. Ningún store, componente ni cliente HTTP está simulado:
 * solo el borde HTTP está simulado con MSW.
 */
function createSearchRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: StubView },
      { path: '/search', name: 'SearchResults', component: SearchResults },
      { path: '/project/:id', name: 'Project', component: StubView },
    ],
  })
}

async function mountSearchView(query: string): Promise<{ wrapper: VueWrapper; router: Router; pinia: Pinia }> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createSearchRouter()
  await router.push({ name: 'SearchResults', query: { q: query } })
  const wrapper = mount(SearchResults, { global: { plugins: [pinia, router] } })
  await flushPromises()
  await nextTick()
  return { wrapper, router, pinia }
}

describe('search flow integration (SearchBar/router/store/MSW)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows results from the real API when the search succeeds', async () => {
    // Arrange & Act (router query -> view watcher -> real store -> MSW)
    const { wrapper } = await mountSearchView('alpha')

    // Assert (render + real store state; MSW base handler returns 2 fixtures)
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Alpha Research Project')
    })
    expect(wrapper.text()).toContain('Beta Research Project')
    expect(wrapper.text()).toContain('2 proyectos encontrados')
    const store = useSearchStore()
    expect(store.results).toHaveLength(2)
    expect(store.error).toBeNull()
    expect(store.isLoading).toBe(false)
    expect(store.lastQuery).toBe('alpha')
  })

  it('shows the empty state when the API returns no results', async () => {
    // Arrange
    server.use(searchEmptyHandler)

    // Act
    const { wrapper } = await mountSearchView('nothing-matches')

    // Assert
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('No se encontraron proyectos')
    })
    const store = useSearchStore()
    expect(store.results).toEqual([])
    expect(store.error).toBeNull()
  })

  it('shows the server error when the API responds with 500', async () => {
    // Arrange
    server.use(searchServerErrorHandler)

    // Act
    const { wrapper } = await mountSearchView('alpha')

    // Assert (store surfaces err.response.data.detail for non-401 errors)
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Error en la búsqueda')
    })
    expect(wrapper.text()).toContain('Error interno del servidor. Por favor, intenta nuevamente.')
    const store = useSearchStore()
    expect(store.results).toEqual([])
    expect(store.error).toBe('Error interno del servidor. Por favor, intenta nuevamente.')
  })

  it('shows an error when the API responds with 401', async () => {
    // Arrange
    server.use(searchUnauthorizedHandler)

    // Act
    const { wrapper } = await mountSearchView('alpha')

    // Assert
    // NOTE (real behavior): src/api/client.ts intercepts the 401 and, with no
    // refreshToken in storage (src/api/client.ts:105-116), converts it into an
    // UnauthorizedError without `response`, so src/stores/search.ts surfaces
    // the generic fallback message instead of the MSW detail. jsdom also logs
    // "Not implemented: navigation" for the interceptor's redirect to /login.
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Error en la búsqueda')
    })
    const store = useSearchStore()
    expect(store.error).toBe('Error al realizar la búsqueda')
    expect(store.results).toEqual([])
  })

  it('integrates SearchBar -> router -> store -> MSW -> rendered results', async () => {
    // Arrange: host with the real SearchBar and a real RouterView; the real
    // SearchResults view renders after navigation and triggers the real store.
    const Host = defineComponent({
      components: { SearchBar },
      template: '<SearchBar /><RouterView />',
    })
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createSearchRouter()
    await router.push('/')
    const wrapper = mount(Host, { global: { plugins: [pinia, router] } })

    // Act: type a query in the real SearchBar and press Enter
    await wrapper.find('input').setValue('alpha')
    await wrapper.find('input').trigger('keyup.enter')

    // Assert: real router navigated and the real view rendered MSW results
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('SearchResults')
    })
    expect(router.currentRoute.value.query.q).toBe('alpha')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Alpha Research Project')
    })
    expect(wrapper.text()).toContain('Beta Research Project')
  })
})
