import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * Extensión personalizada de TipTap para marcar sugerencias de IA
 * Permite resaltar y rastrear sugerencias antes de que sean aceptadas
 */
export const SuggestionMark = Mark.create({
  name: 'suggestion',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-suggestion': 'true',
      'class': 'ai-suggestion-mark'
    }), 0]
  },
})
