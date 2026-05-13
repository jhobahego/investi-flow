import apiClient from './client'
import type { 
  BibliographySearchRequest, 
  BibliographySearchResponse 
} from '../types'

export interface BibliographyReference {
  author: string
  title: string
  file_type?: string
}

export interface SuggestionProjectInfo {
  project_id: string
  project_name: string
  project_theme?: string
}

export interface SuggestionCurrentContext {
  phase?: {
    id: string
    name: string
  }
  task?: {
    id: string
    name: string
  }
}

export interface SuggestionRequest {
  editor_state: {
    text: string
    full_document_content: string
  }
  bibliography?: BibliographyReference[]
  project_info?: SuggestionProjectInfo
  current_context?: SuggestionCurrentContext
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
  },

  /**
   * Busca bibliografía relevante usando IA
   */
  async searchBibliography(projectId: number, data: BibliographySearchRequest): Promise<BibliographySearchResponse> {
    const response = await apiClient.post(`/proyectos/${projectId}/ia/bibliografias`, data)
    return response.data
  }
}
