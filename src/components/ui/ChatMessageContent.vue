<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { renderMarkdownWithCitations } from '@/lib/chatCitations'
import type { DocumentSource } from '@/types'

interface CitationPreview {
  fragmentNumber: number
  fileName: string
  sourceIndex: number
  source: DocumentSource | null
  left: number
  top: number
  placeBelow: boolean
}

const props = withDefaults(
  defineProps<{
    content: string
    sources?: DocumentSource[]
    activeSourceIndex?: number | null
  }>(),
  {
    activeSourceIndex: null
  }
)

const emit = defineEmits<{
  'select-source': [index: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const preview = ref<CitationPreview | null>(null)

const renderedHtml = computed(() => renderMarkdownWithCitations(props.content, props.sources))

const findCitationChip = (target: EventTarget | null): HTMLButtonElement | null => {
  if (!(target instanceof Element)) return null
  return target.closest<HTMLButtonElement>('button.chat-citation-chip')
}

const syncActiveChips = () => {
  const root = contentRef.value
  if (!root) return

  const chips = root.querySelectorAll<HTMLButtonElement>('button.chat-citation-chip')
  chips.forEach((chip) => {
    const chipIndex = Number.parseInt(chip.dataset.sourceIndex ?? '-1', 10)
    const isActive =
      props.activeSourceIndex !== null &&
      props.activeSourceIndex >= 0 &&
      chipIndex === props.activeSourceIndex

    chip.classList.toggle('chat-citation-chip--active', isActive)
    if (chipIndex >= 0) {
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    }
  })
}

const showPreviewForChip = (chip: HTMLButtonElement) => {
  const fragmentNumber = Number.parseInt(chip.dataset.citationFragment ?? '', 10)
  const fileName = chip.dataset.citationFile ?? ''
  const sourceIndex = Number.parseInt(chip.dataset.sourceIndex ?? '-1', 10)

  if (!Number.isInteger(fragmentNumber) || fragmentNumber < 1 || !fileName) {
    return
  }

  const source =
    Number.isInteger(sourceIndex) && sourceIndex >= 0
      ? (props.sources?.[sourceIndex] ?? null)
      : null

  let left = 0
  let top = 0
  let placeBelow = false

  if (containerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()
    const chipRect = chip.getBoundingClientRect()
    const rawLeft = chipRect.left - containerRect.left + chipRect.width / 2
    const halfTooltipWidth = 130

    if (containerRect.width > 0) {
      const minLeft = Math.min(halfTooltipWidth, containerRect.width / 2)
      const maxLeft = Math.max(minLeft, containerRect.width - halfTooltipWidth)
      left = Math.min(Math.max(rawLeft, minLeft), maxLeft)
    } else {
      left = rawLeft
    }

    const chipTop = chipRect.top - containerRect.top
    if (chipTop < 96 && containerRect.height > 0) {
      placeBelow = true
      top = chipRect.bottom - containerRect.top
    } else {
      top = chipTop
    }
  }

  preview.value = {
    fragmentNumber,
    fileName,
    sourceIndex,
    source,
    left,
    top,
    placeBelow
  }
}

const dismissPreview = () => {
  preview.value = null
}

const handleClick = (event: MouseEvent) => {
  const chip = findCitationChip(event.target)
  if (!chip) return

  const sourceIndex = Number.parseInt(chip.dataset.sourceIndex ?? '-1', 10)
  if (Number.isInteger(sourceIndex) && sourceIndex >= 0) {
    emit('select-source', sourceIndex)
  }
}

const handleChipEnter = (event: MouseEvent | FocusEvent) => {
  const chip = findCitationChip(event.target)
  if (!chip) return
  showPreviewForChip(chip)
}

const handleChipLeave = (event: MouseEvent | FocusEvent) => {
  const chip = findCitationChip(event.target)
  if (!chip) return

  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && chip.contains(nextTarget)) {
    return
  }

  dismissPreview()
}

const handleWindowKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && preview.value !== null) {
    dismissPreview()
  }
}

watch([() => props.activeSourceIndex, renderedHtml], syncActiveChips, {
  flush: 'post',
  immediate: true
})

onMounted(() => {
  syncActiveChips()
  window.addEventListener('keydown', handleWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative"
    @click="handleClick"
    @mouseover="handleChipEnter"
    @mouseout="handleChipLeave"
    @focusin="handleChipEnter"
    @focusout="handleChipLeave"
    @keydown.escape="dismissPreview"
  >
    <div
      ref="contentRef"
      class="text-sm markdown-content"
      v-dompurify-html="renderedHtml"
    />

    <div
      v-if="preview"
      role="tooltip"
      class="pointer-events-none absolute z-20 w-64 max-w-[260px] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700 shadow-md"
      :class="preview.placeBelow ? 'mt-1.5' : '-translate-y-full -mt-1.5'"
      :style="{ left: `${preview.left}px`, top: `${preview.top}px` }"
    >
      <div class="flex items-center justify-between gap-2 text-[11px] text-gray-500">
        <span class="font-medium text-primary-700">Fragmento {{ preview.fragmentNumber }}</span>
        <span v-if="preview.source" class="tabular-nums text-gray-400">
          {{ Math.round(preview.source.similarity * 100) }}%
        </span>
      </div>
      <p class="mt-0.5 truncate font-medium text-gray-800" :title="preview.fileName">
        {{ preview.fileName }}
      </p>
      <p v-if="preview.source?.snippet" class="mt-1 line-clamp-2 italic text-gray-600">
        “{{ preview.source.snippet }}”
      </p>
      <p v-if="preview.source" class="mt-1 text-[10px] text-gray-400">
        Clic para resaltar en fuentes
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para contenido Markdown renderizado */
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.15em;
}

.markdown-content :deep(h4) {
  font-size: 1em;
}

.markdown-content :deep(p) {
  margin-bottom: 0.75em;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 0.75em;
  padding-left: 1.5em;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
  list-style-position: outside;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
  list-style-position: outside;
}

.markdown-content :deep(ul ul) {
  list-style-type: circle;
}

.markdown-content :deep(ul ul ul) {
  list-style-type: square;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25em;
  display: list-item;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
  margin-bottom: 0.75em;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1em;
  margin-left: 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: #2563eb;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5em 0;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.75em;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.5em;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* Citas inline superíndice sobrias y no invasivas */
.markdown-content :deep(.chat-citation-chip) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: -0.2em;
  vertical-align: baseline;
  line-height: 1;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.375rem;
  margin: 0 0.125rem;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid rgba(209, 213, 219, 0.85);
  background-color: rgba(255, 255, 255, 0.9);
  color: #4b5563;
  cursor: default;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
}

.markdown-content :deep(.chat-citation-chip--linked) {
  cursor: pointer;
}

.markdown-content :deep(.chat-citation-chip--linked:hover) {
  background-color: #eff6ff;
  color: #1d4ed8;
  border-color: #93c5fd;
}

.markdown-content :deep(.chat-citation-chip:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #3b82f6;
}

.markdown-content :deep(.chat-citation-chip--active) {
  background-color: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

@media (prefers-reduced-motion: reduce) {
  .markdown-content :deep(.chat-citation-chip) {
    transition: none;
  }
}
</style>
