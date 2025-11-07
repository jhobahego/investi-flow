import { ref, type Ref } from 'vue'
import { aiService, type SuggestionRequest } from '../api/aiService'
import type { Editor } from '@tiptap/vue-3'

export function useAISuggestions(editor: Ref<Editor | undefined>) {
  const isLoading = ref(false)
  const suggestion = ref<string | null>(null)
  const error = ref<string | null>(null)
  const suggestionRange = ref<{ from: number; to: number } | null>(null)

  /**
   * Solicita una sugerencia de IA basada en el contenido del editor
   */
  async function requestSuggestion(
    bibliography: any[] = [],
    projectInfo: any = null
  ): Promise<void> {
    if (!editor.value) {
      console.warn('Editor no está disponible')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const { to } = editor.value.state.selection
      const cursorPos = to
      const docSize = editor.value.state.doc.content.size
      const fullContent = editor.value.getText().trim()

      if (!fullContent) {
        error.value = 'Por favor, escribe algo de contenido antes de solicitar una sugerencia'
        return
      }

      let contextText = ''
      const isAtEnd = cursorPos >= docSize - 2 || cursorPos >= fullContent.length - 10
      
      if (isAtEnd) {
        const contextLength = 800
        const startPos = Math.max(0, fullContent.length - contextLength)
        contextText = fullContent.substring(startPos).trim()
      } else {
        const textBefore = editor.value.state.doc.textBetween(
          Math.max(0, cursorPos - 500),
          cursorPos,
          '\n'
        ).trim()
        contextText = textBefore
      }

      if (!contextText) {
        contextText = fullContent
      }

      const requestData: SuggestionRequest = {
        text: contextText,
        document_content: fullContent,
        bibliography: bibliography.length > 0 ? bibliography : undefined,
        project_info: projectInfo || undefined
      }

      const response = await aiService.getSuggestion(requestData)
      suggestion.value = response.suggestion

      showInlineSuggestion(response.suggestion)
    } catch (err: any) {
      console.error('Error al obtener sugerencia:', err)
      error.value = err.message || 'Error al generar sugerencia de IA'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Muestra la sugerencia como texto fantasma en el editor
   */
  function showInlineSuggestion(text: string): void {
    if (!editor.value || !text) return

    const { from } = editor.value.state.selection
    const htmlContent = convertTextToHtml(text)

    editor.value
      .chain()
      .focus()
      .insertContentAt(from, htmlContent)
      .run()

    const endPosition = editor.value.state.selection.to
    suggestionRange.value = { from, to: endPosition }

    editor.value
      .chain()
      .focus()
      .setTextSelection({ from, to: endPosition })
      .setMark('suggestion')
      .run()
  }

  /**
   * Convierte texto plano con saltos de línea a HTML para TipTap
   */
  function convertTextToHtml(text: string): string {
    text = text.replace(/^\n+/, '')
    const paragraphs = text.split(/\n\n+/)
    
    const htmlParts = paragraphs.map(paragraph => {
      if (paragraph.includes('\n')) {
        const lines = paragraph.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        return `<p>${lines.join('<br>')}</p>`
      }
      
      const trimmed = paragraph.trim()
      if (trimmed.length > 0) {
        return `<p>${trimmed}</p>`
      }
      return ''
    }).filter(p => p.length > 0)
    
    return htmlParts.join('')
  }

  /**
   * Acepta la sugerencia actual (ya está insertada, solo removemos la marca)
   */
  function acceptSuggestion(): void {
    if (!editor.value || !suggestion.value || !suggestionRange.value) return

    const { from, to } = suggestionRange.value

    editor.value
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .unsetMark('suggestion')
      .setTextSelection(to)
      .run()

    clearSuggestion()
  }

  /**
   * Rechaza la sugerencia y elimina el texto insertado
   */
  function rejectSuggestion(): void {
    if (!editor.value || !suggestion.value || !suggestionRange.value) return

    const { from, to } = suggestionRange.value

    editor.value
      .chain()
      .focus()
      .deleteRange({ from, to })
      .setTextSelection(from)
      .run()

    clearSuggestion()
  }

  /**
   * Limpia el estado de la sugerencia
   */
  function clearSuggestion(): void {
    suggestion.value = null
    suggestionRange.value = null
    error.value = null
  }

  return {
    isLoading,
    suggestion,
    error,
    requestSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion
  }
}
