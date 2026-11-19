import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { ENV } from '@/config/env.config'
import { FileType, type AttachmentResponse, type IndexingStatus } from '@/types'
import { useAttachmentsStore } from '@/stores/attachments'

const API = ENV.API_URL

function makeAttachment(overrides: Partial<AttachmentResponse> = {}): AttachmentResponse {
  return {
    id: 10,
    file_name: 'tesis.docx',
    file_type: FileType.DOCX,
    file_size: 4096,
    file_path: 'uploads/tesis.docx',
    project_id: 1,
    phase_id: null,
    task_id: null,
    indexing_status: 'pending',
    created_at: '2026-11-18T10:00:00Z',
    updated_at: '2026-11-18T10:00:00Z',
    ...overrides,
  }
}

describe('attachments store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setActivePinia(createPinia())
  })

  describe('getDocument', () => {
    it.each([
      ['project', '/proyectos/1/documentos', { project_id: 1 }],
      ['phase', '/fases/2/documentos', { project_id: null, phase_id: 2 }],
      ['task', '/tareas/3/documentos', { project_id: null, task_id: 3 }],
    ] as const)(
      'fetches %s document from %s, caches it, and returns cache on subsequent calls',
      async (entityType, path, relationFields) => {
        const entityId = entityType === 'project' ? 1 : entityType === 'phase' ? 2 : 3
        let callCount = 0
        const expected = makeAttachment({ id: entityId * 10, ...relationFields })

        server.use(
          http.get(`${API}${path}`, () => {
            callCount += 1
            return HttpResponse.json(expected)
          }),
        )

        const store = useAttachmentsStore()

        const first = await store.getDocument(entityType, entityId)
        const second = await store.getDocument(entityType, entityId)

        expect(first).toEqual(expected)
        expect(second).toEqual(expected)
        expect(callCount).toBe(1)
        expect(store.getCachedDocument(entityType, entityId)).toEqual(expected)
      },
    )

    it('caches null and returns null on 404', async () => {
      let callCount = 0
      server.use(
        http.get(`${API}/proyectos/5/documentos`, () => {
          callCount += 1
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
        }),
      )

      const store = useAttachmentsStore()

      const first = await store.getDocument('project', 5)
      const second = await store.getDocument('project', 5)

      expect(first).toBeNull()
      expect(second).toBeNull()
      expect(callCount).toBe(1)
      expect(store.getCachedDocument('project', 5)).toBeNull()
    })
  })

  describe('refreshDocument', () => {
    it.each([
      ['project', '/proyectos/1/documentos', 1],
      ['phase', '/fases/2/documentos', 2],
      ['task', '/tareas/3/documentos', 3],
    ] as const)(
      'always fetches %s from %s bypassing existing cache and updates cache on non-null response',
      async (entityType, path, entityId) => {
        const statuses: IndexingStatus[] = ['pending', 'indexing', 'indexed']
        let callCount = 0

        server.use(
          http.get(`${API}${path}`, () => {
            const status = statuses[Math.min(callCount, statuses.length - 1)]
            callCount += 1
            return HttpResponse.json(makeAttachment({ id: 99, indexing_status: status }))
          }),
        )

        const store = useAttachmentsStore()
        const initial = await store.getDocument(entityType, entityId)
        expect(initial?.indexing_status).toBe('pending')

        const refreshed1 = await store.refreshDocument(entityType, entityId)
        expect(refreshed1?.indexing_status).toBe('indexing')
        expect(store.getCachedDocument(entityType, entityId)?.indexing_status).toBe('indexing')

        const refreshed2 = await store.refreshDocument(entityType, entityId)
        expect(refreshed2?.indexing_status).toBe('indexed')
        expect(store.getCachedDocument(entityType, entityId)?.indexing_status).toBe('indexed')
        expect(callCount).toBe(3)
      },
    )

    it('does NOT overwrite cached attachment when GET returns 200 null', async () => {
      const existing = makeAttachment({ id: 7, indexing_status: 'pending' })
      server.use(
        http.get(`${API}/proyectos/1/documentos`, () => {
          return HttpResponse.json(null)
        }),
      )

      const store = useAttachmentsStore()
      store.setCachedDocument('project', 1, existing)

      const result = await store.refreshDocument('project', 1)

      expect(result).toBeNull()
      expect(store.getCachedDocument('project', 1)).toEqual(existing)
    })

    it('does NOT overwrite cached attachment when GET returns 404', async () => {
      const existing = makeAttachment({ id: 7, indexing_status: 'indexing' })
      server.use(
        http.get(`${API}/tareas/4/documentos`, () => {
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
        }),
      )

      const store = useAttachmentsStore()
      store.setCachedDocument('task', 4, existing)

      const result = await store.refreshDocument('task', 4)

      expect(result).toBeNull()
      expect(store.getCachedDocument('task', 4)).toEqual(existing)
    })

    it('refreshes silently without toggling store.loading to true', async () => {
      let loadingDuringRequest: boolean | null = null
      const store = useAttachmentsStore()

      server.use(
        http.get(`${API}/proyectos/1/documentos`, () => {
          loadingDuringRequest = store.loading
          return HttpResponse.json(makeAttachment({ indexing_status: 'indexed' }))
        }),
      )

      store.setCachedDocument('project', 1, makeAttachment({ indexing_status: 'pending' }))
      await store.refreshDocument('project', 1)

      expect(loadingDuringRequest).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('propagates non-404 errors without overwriting cache', async () => {
      const existing = makeAttachment({ id: 7, indexing_status: 'pending' })
      server.use(
        http.get(`${API}/proyectos/1/documentos`, () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 })
        }),
      )

      const store = useAttachmentsStore()
      store.setCachedDocument('project', 1, existing)

      await expect(store.refreshDocument('project', 1)).rejects.toThrow()
      expect(store.getCachedDocument('project', 1)).toEqual(existing)
      expect(store.error).toBeNull()
    })
  })

  describe('setCachedDocument', () => {
    it('sets cache directly so getCachedDocument returns the updated attachment', () => {
      const store = useAttachmentsStore()
      const attachment = makeAttachment({ id: 42, task_id: 9, project_id: null, indexing_status: 'indexed' })

      store.setCachedDocument('task', 9, attachment)

      expect(store.getCachedDocument('task', 9)).toEqual(attachment)
    })
  })
})
