import { ref, type Ref } from 'vue'
import { aiService, type SuggestionRequest } from '../api/aiService'
import type { Editor } from '@tiptap/vue-3'

export function useAISuggestions(editor: Ref<Editor | undefined>) {
  const isLoading = ref(false)
  const suggestion = ref<string | null>(null)
  const error = ref<string | null>(null)
  const suggestionRange = ref<{ from: number; to: number } | null>(null)
  
  // Variable para guardar la posición de inserción (usando variable simple, no ref)
  let savedInsertPosition: number | null = null

  /**
   * Transforma la bibliografía del formato frontend al formato esperado por la API
   */
  function transformBibliography(bibliography: any[]): any[] {
    return bibliography.map(item => ({
      author: item.author || item.autores || '',
      title: item.title || item.titulo || '',
      file_type: item.type || item.tipo || 'articulo'
    }))
  }

  /**
   * Solicita una sugerencia de IA basada en el contenido del editor
   * @param bibliography - Lista de bibliografías del proyecto
   * @param projectInfo - Información del proyecto
   * @param currentContext - Contexto actual de fase y tarea
   * @param insertAt - Posición donde insertar la sugerencia. Si es undefined, usa la posición actual del cursor
   */
  async function requestSuggestion(
    bibliography: any[] = [],
    projectInfo: any = null,
    currentContext: any = null,
    insertAt?: number
  ): Promise<void> {
    if (!editor.value) {
      console.warn('Editor no está disponible')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const { from, to } = editor.value.state.selection
      const cursorPos = to
      const docSize = editor.value.state.doc.content.size
      const fullContent = editor.value.getText().trim()
      
      // Usar la posición explícita si se proporciona, sino usar la posición del cursor
      if (insertAt !== undefined) {
        savedInsertPosition = insertAt
      } else {
        // Si hay selección, usar 'from'; si es cursor simple, usar 'to'
        savedInsertPosition = from === to ? to : from
      }

      if (!fullContent) {
        error.value = 'Por favor, escribe algo de contenido antes de solicitar una sugerencia'
        return
      }

      // Límite máximo para el campo text (el backend acepta hasta 1000)
      const MAX_TEXT_LENGTH = 900
      
      let contextText = ''
      const isAtEnd = cursorPos >= docSize - 2 || cursorPos >= fullContent.length - 10
      
      if (isAtEnd) {
        // Al final del documento: tomar los últimos caracteres
        const startPos = Math.max(0, fullContent.length - MAX_TEXT_LENGTH)
        contextText = fullContent.substring(startPos).trim()
      } else {
        // En medio del documento: tomar texto antes del cursor
        const textBefore = editor.value.state.doc.textBetween(
          Math.max(0, cursorPos - MAX_TEXT_LENGTH),
          cursorPos,
          '\n'
        ).trim()
        contextText = textBefore
      }

      // Fallback si contextText está vacío
      if (!contextText) {
        contextText = fullContent
      }
      
      // Truncar para asegurar que no exceda el límite del backend
      if (contextText.length > MAX_TEXT_LENGTH) {
        contextText = contextText.substring(contextText.length - MAX_TEXT_LENGTH).trim()
      }

      const transformedBibliography = bibliography.length > 0 
        ? transformBibliography(bibliography) 
        : undefined

      const requestData: SuggestionRequest = {
        editor_state: {
          text: contextText,
          full_document_content: fullContent
        },
        bibliography: transformedBibliography,
        project_info: projectInfo || undefined,
        current_context: currentContext || undefined
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

    // Usar la posición guardada, o la posición actual del cursor como fallback
    let from = savedInsertPosition
    if (from === null || from === undefined) {
      from = editor.value.state.selection.from
    }
    
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
    
    // Limpiar la posición guardada
    savedInsertPosition = null
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
    savedInsertPosition = null
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
