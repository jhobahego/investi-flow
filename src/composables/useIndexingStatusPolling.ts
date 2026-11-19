import {
  getCurrentScope,
  onScopeDispose,
  readonly,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import type { AttachmentEntityType } from '../stores/attachments'
import type { AttachmentResponse, IndexingStatus } from '../types'

export const DEFAULT_POLL_INTERVAL_MS = 2000
export const DEFAULT_MAX_POLL_DURATION_MS = 60_000

export function isPollableIndexingStatus(status?: IndexingStatus): boolean {
  return status === 'pending' || status === 'indexing'
}

export interface UseIndexingStatusPollingOptions {
  entityType: MaybeRefOrGetter<AttachmentEntityType>
  entityId: MaybeRefOrGetter<number>
  attachment: MaybeRefOrGetter<AttachmentResponse | null | undefined>
  refresh: (entityType: AttachmentEntityType, entityId: number) => Promise<AttachmentResponse | null>
  onStatusChange?: (attachment: AttachmentResponse) => void
  intervalMs?: number
  maxDurationMs?: number
}

export interface UseIndexingStatusPollingReturn {
  isPolling: Readonly<Ref<boolean>>
  currentStatus: Readonly<Ref<IndexingStatus | undefined>>
  stop: () => void
}

/**
 * Polls attachment indexing status every 2s while `pending` or `indexing`,
 * stopping on terminal states (`indexed` | `error`), unmount/dispose, or 60s timeout.
 */
export function useIndexingStatusPolling(
  options: UseIndexingStatusPollingOptions,
): UseIndexingStatusPollingReturn {
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const maxDurationMs = options.maxDurationMs ?? DEFAULT_MAX_POLL_DURATION_MS

  const isPolling = shallowRef(false)
  const currentStatus = shallowRef<IndexingStatus | undefined>(
    toValue(options.attachment)?.indexing_status,
  )

  let intervalId: ReturnType<typeof setInterval> | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let generation = 0
  let startedAt = 0

  function clearTimers() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function stop() {
    generation += 1
    inFlight = false
    isPolling.value = false
    clearTimers()
  }

  async function tick(runGen: number) {
    if (generation !== runGen || !isPolling.value || inFlight) {
      return
    }
    if (Date.now() - startedAt >= maxDurationMs) {
      stop()
      return
    }

    inFlight = true
    try {
      const updated = await options.refresh(
        toValue(options.entityType),
        toValue(options.entityId),
      )

      if (generation !== runGen || !isPolling.value || !updated) {
        return
      }

      if (updated.indexing_status && updated.indexing_status !== currentStatus.value) {
        currentStatus.value = updated.indexing_status
        options.onStatusChange?.(updated)
      }

      if (updated.indexing_status && !isPollableIndexingStatus(updated.indexing_status)) {
        stop()
      }
    } catch {
      // Transient refresh errors are ignored so the next interval can retry up to maxDurationMs.
    } finally {
      if (generation === runGen) {
        inFlight = false
      }
    }
  }

  function start() {
    clearTimers()
    generation += 1
    const runGen = generation
    inFlight = false
    startedAt = Date.now()
    isPolling.value = true

    // Register hard stop timeout before interval so boundary collisions stop before ticking.
    timeoutId = setTimeout(() => {
      if (generation === runGen) {
        stop()
      }
    }, maxDurationMs)

    intervalId = setInterval(() => {
      void tick(runGen)
    }, intervalMs)
  }

  watch(
    [
      () => toValue(options.entityType),
      () => toValue(options.entityId),
      () => toValue(options.attachment)?.id,
      () => toValue(options.attachment)?.indexing_status,
    ],
    ([entityType, entityId, attachmentId, status], prev) => {
      const targetChanged =
        prev !== undefined &&
        (entityType !== prev[0] || entityId !== prev[1] || attachmentId !== prev[2])

      currentStatus.value = status

      if (attachmentId == null || !isPollableIndexingStatus(status)) {
        stop()
        return
      }

      if (targetChanged || !isPolling.value) {
        start()
      }
    },
    { immediate: true },
  )

  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  return {
    isPolling: readonly(isPolling),
    currentStatus: readonly(currentStatus),
    stop,
  }
}
