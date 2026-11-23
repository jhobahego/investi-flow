<script setup lang="ts">
import { ref, watch, nextTick, type ComponentPublicInstance } from 'vue'
import { DocumentTextIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { cn } from '@/lib/utils'
import type { DocumentSource } from '@/types'

const props = withDefaults(
  defineProps<{
    sources: DocumentSource[]
    highlightedIndex?: number | null
    highlightTrigger?: number
  }>(),
  {
    highlightedIndex: null,
    highlightTrigger: 0
  }
)

const emit = defineEmits<{
  'clear-highlight': []
}>()

const open = ref(false)
const itemRefs = ref<(HTMLLIElement | null)[]>([])

const setItemRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  itemRefs.value[index] = el instanceof HTMLLIElement ? el : null
}

const isHighlighted = (index: number): boolean =>
  props.highlightedIndex !== null && props.highlightedIndex === index

const handleToggle = () => {
  open.value = !open.value
  if (!open.value && props.highlightedIndex !== null) {
    emit('clear-highlight')
  }
}

watch(
  [() => props.highlightedIndex, () => props.highlightTrigger],
  async ([index]) => {
    if (index === null || index < 0 || index >= props.sources.length) {
      return
    }
    open.value = true
    await nextTick()
    itemRefs.value[index]?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  },
  { immediate: true }
)
</script>

<template>
  <div class="mt-3 border-t border-gray-200 pt-2" data-testid="chat-sources">
    <button
      type="button"
      class="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
      :aria-expanded="open"
      @click="handleToggle"
    >
      <ChevronDownIcon class="h-3 w-3 transition-transform" :class="open ? 'rotate-180' : ''" />
      Fuentes consultadas ({{ sources.length }})
    </button>
    <ul v-if="open" class="mt-2 space-y-2">
      <li
        v-for="(source, i) in sources"
        :key="`${source.attachment_id}-${source.chunk_index}-${i}`"
        :ref="(el) => setItemRef(el, i)"
        :data-highlighted="isHighlighted(i) ? 'true' : undefined"
        :class="
          cn(
            'rounded border border-gray-200 bg-white p-2 text-xs transition-colors',
            isHighlighted(i) && 'border-primary-300 bg-primary-50/70 ring-1 ring-primary-200'
          )
        "
      >
        <div class="flex items-center gap-1.5 font-medium text-gray-800">
          <span
            :class="
              cn(
                'inline-flex h-4 min-w-[1rem] flex-shrink-0 items-center justify-center rounded-full bg-gray-100 px-1 text-[10px] font-medium text-gray-600',
                isHighlighted(i) && 'bg-primary-100 text-primary-800'
              )
            "
          >
            {{ i + 1 }}
          </span>
          <DocumentTextIcon class="h-3 w-3 flex-shrink-0" />
          <span class="truncate" :title="source.file_name">{{ source.file_name }}</span>
          <span class="ml-auto text-gray-400">{{ Math.round(source.similarity * 100) }}%</span>
        </div>
        <p class="mt-1 italic text-gray-600" :title="source.snippet">“{{ source.snippet }}”</p>
      </li>
    </ul>
  </div>
</template>
