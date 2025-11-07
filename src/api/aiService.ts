import apiClient from './client'

export interface BibliographyReference {
  autores: string
  anio: number
  titulo: string
  tipo: string
}

export interface SuggestionRequest {
  text: string
  document_content: string
  bibliography?: BibliographyReference[]
  project_info?: {
    name?: string
    description?: string
    research_type?: string
  }
}

export interface SuggestionResponse {
  suggestion: string
  model_used: string
}

export const aiService = {
  /**
   * Obtiene una sugerencia de IA para continuar el texto
   */
  async getSuggestion(data: SuggestionRequest): Promise<SuggestionResponse> {
    const response = await apiClient.post('/ia/sugerencias', data)
    return response.data
  }
}
