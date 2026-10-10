import { http, HttpResponse, type RequestHandler } from 'msw'
import { ENV } from '@/config/env.config'
import { ProjectStatus, type ProjectResponse } from '@/types'

/**
 * Exact search URL used by the app.
 * Derived from the same ENV module as src/api/client.ts (baseURL: ENV.API_URL)
 * plus the path used by src/stores/search.ts ('/proyectos/search'), so the
 * mock always matches the real client regardless of VITE_API_URL.
 * MSW matches the path ignoring query params (?query=...).
 */
export const SEARCH_URL = `${ENV.API_URL}/proyectos/search`

export const searchFixtureProjects: ProjectResponse[] = [
  {
    id: 1,
    name: 'Alpha Research Project',
    description: 'Study on alpha particles',
    research_type: null,
    institution: 'Universidad Nacional',
    research_group: null,
    category: null,
    status: ProjectStatus.PLANNING,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Beta Research Project',
    description: 'Study on beta decay',
    research_type: null,
    institution: 'Instituto Tecnológico',
    research_group: null,
    category: null,
    status: ProjectStatus.IN_PROGRESS,
    created_at: '2024-02-01T00:00:00.000Z',
    updated_at: '2024-02-02T00:00:00.000Z',
  },
]

/** Base handler: search succeeds with results. */
export const searchSuccessHandler = http.get(SEARCH_URL, () => {
  return HttpResponse.json<ProjectResponse[]>(searchFixtureProjects)
})

/** Override via server.use(): search succeeds but returns no results. */
export const searchEmptyHandler = http.get(SEARCH_URL, () => {
  return HttpResponse.json<ProjectResponse[]>([])
})

/** Override via server.use(): search fails with 401 Unauthorized. */
export const searchUnauthorizedHandler = http.get(SEARCH_URL, () => {
  return HttpResponse.json({ detail: 'No autorizado. Por favor, inicia sesión nuevamente.' }, { status: 401 })
})

/** Override via server.use(): search fails with 500 Server Error. */
export const searchServerErrorHandler = http.get(SEARCH_URL, () => {
  return HttpResponse.json({ detail: 'Error interno del servidor. Por favor, intenta nuevamente.' }, { status: 500 })
})

// Base handler list consumed by tests/mocks/server.ts: success with results.
// Per-test scenarios use server.use() with the override handlers above
// (server.resetHandlers() after each test is already global in tests/setup.ts).
export const handlers: RequestHandler[] = [searchSuccessHandler]
