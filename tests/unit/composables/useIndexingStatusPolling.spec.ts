import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { FileType, type AttachmentResponse } from '@/types'
import { useIndexingStatusPolling } from '@/composables/useIndexingStatusPolling'

function makeAttachment(overrides: Partial<AttachmentResponse> = {}): AttachmentResponse {
  return {
    id: 7,
    file_name: 'tesis.docx',
    file_type: FileType.DOCX,
    file_size: 2048,
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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useIndexingStatusPolling', () => {
  let scopes: EffectScope[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    scopes = []
  })

  afterEach(() => {
    for (const scope of scopes) {
      scope.stop()
    }
    vi.useRealTimers()
  })

  function runInScope<T>(fn: () => T): { result: T; scope: EffectScope } {
    const scope = effectScope()
    scopes.push(scope)
    let result!: T
    scope.run(() => {
      result = fn()
    })
    return { result, scope }
  }

  it('polls pending -> indexing -> indexed every 2s, emits changes only when status changes, and stops at indexed', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ indexing_status: 'pending' }))
    const refresh = vi
      .fn()
      .mockResolvedValueOnce(makeAttachment({ indexing_status: 'indexing' }))
      .mockResolvedValueOnce(makeAttachment({ indexing_status: 'indexing' }))
      .mockResolvedValueOnce(makeAttachment({ indexing_status: 'indexed' }))
    const onStatusChange = vi.fn()

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
        onStatusChange,
      }),
    )

    expect(result.isPolling.value).toBe(true)
    expect(result.currentStatus.value).toBe('pending')

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledWith('project', 1)
    expect(result.currentStatus.value).toBe('indexing')
    expect(result.isPolling.value).toBe(true)
    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(onStatusChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ indexing_status: 'indexing' }),
    )

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(2)
    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(result.isPolling.value).toBe(true)

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(3)
    expect(result.currentStatus.value).toBe('indexed')
    expect(result.isPolling.value).toBe(false)
    expect(onStatusChange).toHaveBeenCalledTimes(2)
    expect(onStatusChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ indexing_status: 'indexed' }),
    )

    await vi.advanceTimersByTimeAsync(10_000)
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('stops polling when status transitions to error', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ indexing_status: 'pending' }))
    const refresh = vi.fn().mockResolvedValueOnce(makeAttachment({ indexing_status: 'error' }))
    const onStatusChange = vi.fn()

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'task',
        entityId: 12,
        attachment,
        refresh,
        onStatusChange,
      }),
    )

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(result.currentStatus.value).toBe('error')
    expect(result.isPolling.value).toBe(false)
    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(onStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ indexing_status: 'error' }),
    )

    await vi.advanceTimersByTimeAsync(10_000)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['indexed', makeAttachment({ indexing_status: 'indexed' })],
    ['error', makeAttachment({ indexing_status: 'error' })],
    ['undefined status', makeAttachment({ indexing_status: undefined })],
    ['null attachment', null],
  ])('does not poll for non-pollable initial state: %s', async (_label, initialAttachment) => {
    const attachment = ref<AttachmentResponse | null>(initialAttachment)
    const refresh = vi.fn()

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
      }),
    )

    expect(result.isPolling.value).toBe(false)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('hard stops after 60s when status stays pending', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ indexing_status: 'pending' }))
    const refresh = vi.fn().mockResolvedValue(makeAttachment({ indexing_status: 'pending' }))

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
      }),
    )

    await vi.advanceTimersByTimeAsync(60_000)
    expect(result.isPolling.value).toBe(false)
    const callsAtHardStop = refresh.mock.calls.length
    expect(callsAtHardStop).toBeGreaterThan(0)
    expect(callsAtHardStop).toBeLessThanOrEqual(30)

    await vi.advanceTimersByTimeAsync(20_000)
    expect(refresh).toHaveBeenCalledTimes(callsAtHardStop)
  })

  it('does NOT reset the 60s hard stop when transitioning pending -> indexing on the same attachment id', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ id: 7, indexing_status: 'pending' }))
    const refresh = vi.fn().mockImplementation(async () => makeAttachment({ id: 7, indexing_status: 'indexing' }))
    const onStatusChange = vi.fn((updated: AttachmentResponse) => {
      attachment.value = updated
    })

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
        onStatusChange,
      }),
    )

    // At 30s, status becomes 'indexing' on same attachment.id
    await vi.advanceTimersByTimeAsync(30_000)
    expect(result.currentStatus.value).toBe('indexing')
    expect(result.isPolling.value).toBe(true)

    // Advancing another 30s reaches 60s total -> must hard stop, NOT extend to 90s
    await vi.advanceTimersByTimeAsync(30_000)
    expect(result.isPolling.value).toBe(false)
    const totalCalls = refresh.mock.calls.length

    await vi.advanceTimersByTimeAsync(30_000)
    expect(refresh).toHaveBeenCalledTimes(totalCalls)
  })

  it('clears timers on scope dispose / unmount and ignores late in-flight responses', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ indexing_status: 'pending' }))
    const pendingReq = deferred<AttachmentResponse | null>()
    const refresh = vi.fn().mockReturnValueOnce(pendingReq.promise)
    const onStatusChange = vi.fn()

    const { result, scope } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
        onStatusChange,
      }),
    )

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(1)

    scope.stop()
    expect(result.isPolling.value).toBe(false)

    // Late resolution after unmount must not invoke onStatusChange
    pendingReq.resolve(makeAttachment({ indexing_status: 'indexed' }))
    await Promise.resolve()
    await nextTick()
    expect(onStatusChange).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(10_000)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate concurrent requests while a previous refresh is still in flight', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ indexing_status: 'pending' }))
    const req1 = deferred<AttachmentResponse | null>()
    const refresh = vi
      .fn()
      .mockReturnValueOnce(req1.promise)
      .mockResolvedValueOnce(makeAttachment({ indexing_status: 'indexed' }))

    runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
      }),
    )

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(4000)
    expect(refresh).toHaveBeenCalledTimes(1)

    req1.resolve(makeAttachment({ indexing_status: 'indexing' }))
    await Promise.resolve()
    await nextTick()

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('restarts cleanly with a fresh 60s budget when attachment id changes and ignores stale in-flight responses', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ id: 7, indexing_status: 'pending' }))
    const staleReq = deferred<AttachmentResponse | null>()
    const refresh = vi
      .fn()
      .mockImplementation(async () => makeAttachment({ id: 8, indexing_status: 'pending' }))
    // Override up to 40s (20 ticks of 2000ms) so the 21st tick at 40s returns staleReq
    for (let i = 0; i < 19; i += 1) {
      refresh.mockResolvedValueOnce(makeAttachment({ id: 7, indexing_status: 'pending' }))
    }
    refresh.mockReturnValueOnce(staleReq.promise)
    const onStatusChange = vi.fn()

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
        onStatusChange,
      }),
    )

    // Advance 40s: 20th tick launches staleReq for id 7
    await vi.advanceTimersByTimeAsync(40_000)
    expect(refresh).toHaveBeenCalledTimes(20)

    // Replace attachment with id: 8
    attachment.value = makeAttachment({ id: 8, indexing_status: 'pending' })
    await nextTick()
    expect(result.isPolling.value).toBe(true)

    // Stale response for id 7 resolves as 'indexed' -> MUST be ignored
    staleReq.resolve(makeAttachment({ id: 7, indexing_status: 'indexed' }))
    await Promise.resolve()
    await nextTick()
    expect(result.isPolling.value).toBe(true)
    expect(result.currentStatus.value).toBe('pending')
    expect(onStatusChange).not.toHaveBeenCalled()

    // After another 40s (80s total, 40s since switch to id 8), id 8 must still be polling
    await vi.advanceTimersByTimeAsync(40_000)
    expect(result.isPolling.value).toBe(true)
    expect(refresh.mock.calls.length).toBe(40)

    // At 60s since switch to id 8 (20s more), polling stops
    await vi.advanceTimersByTimeAsync(20_000)
    expect(result.isPolling.value).toBe(false)
  })

  it('continues polling when refresh returns null or rejects transiently', async () => {
    const attachment = ref<AttachmentResponse | null>(makeAttachment({ indexing_status: 'pending' }))
    const refresh = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('Network blip'))
      .mockResolvedValueOnce(makeAttachment({ indexing_status: 'indexed' }))
    const onStatusChange = vi.fn()

    const { result } = runInScope(() =>
      useIndexingStatusPolling({
        entityType: 'project',
        entityId: 1,
        attachment,
        refresh,
        onStatusChange,
      }),
    )

    await vi.advanceTimersByTimeAsync(2000)
    expect(onStatusChange).not.toHaveBeenCalled()
    expect(result.isPolling.value).toBe(true)
    expect(result.currentStatus.value).toBe('pending')

    await vi.advanceTimersByTimeAsync(2000)
    expect(onStatusChange).not.toHaveBeenCalled()
    expect(result.isPolling.value).toBe(true)

    await vi.advanceTimersByTimeAsync(2000)
    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(result.currentStatus.value).toBe('indexed')
    expect(result.isPolling.value).toBe(false)
  })
})
