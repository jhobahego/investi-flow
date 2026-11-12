<script setup lang="ts">
import { ref } from 'vue'
import { DocumentTextIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { DocumentSource } from '@/types'

defineProps<{ sources: DocumentSource[] }>()

const open = ref(false)
</script>

<template>
  <div class="mt-3 border-t border-gray-200 pt-2" data-testid="chat-sources">
    <button
      type="button"
      class="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
      :aria-expanded="open"
      @click="open = !open"
    >
      <ChevronDownIcon class="h-3 w-3 transition-transform" :class="open ? 'rotate-180' : ''" />
      Fuentes consultadas ({{ sources.length }})
    </button>
    <ul v-if="open" class="mt-2 space-y-2">
      <li
        v-for="(source, i) in sources"
        :key="`${source.attachment_id}-${source.chunk_index}-${i}`"
        class="rounded border border-gray-200 bg-white p-2 text-xs"
      >
        <div class="flex items-center gap-1 font-medium text-gray-800">
          <DocumentTextIcon class="h-3 w-3 flex-shrink-0" />
          <span class="truncate" :title="source.file_name">{{ source.file_name }}</span>
          <span class="ml-auto text-gray-400">{{ Math.round(source.similarity * 100) }}%</span>
        </div>
        <p class="mt-1 italic text-gray-600" :title="source.snippet">“{{ source.snippet }}”</p>
      </li>
    </ul>
  </div>
</template>
