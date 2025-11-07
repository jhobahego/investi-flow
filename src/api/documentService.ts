/**
 * Servicio para gestión de documentos y extracción de contenido
 */
import apiClient from './client'

/**
 * Extiende la respuesta de attachment con contenido HTML
 * Incluye todos los campos de AttachmentResponse del backend
 */
export interface DocumentContent {
  // Campos de AttachmentResponse
  id: number
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  project_id: number | null
  phase_id: number | null
  task_id: number | null
  created_at: string
  updated_at: string
  // Campo adicional para extracción
  html_content: string
}

/**
 * Extiende la respuesta de attachment con páginas HTML
 */
export interface DocumentPages {
  // Campos de AttachmentResponse
  id: number
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  project_id: number | null
  phase_id: number | null
  task_id: number | null
  created_at: string
  updated_at: string
  // Campos adicionales para paginación
  pages: string[]
  total_pages: number
}

export interface DocumentPreview {
  attachment_id: number
  file_name: string
  preview: string
  max_chars: number
}

/**
 * Extrae el contenido de un documento .docx y lo convierte a HTML
 * @param attachmentId - ID del adjunto/documento
 * @returns Contenido HTML del documento
 */
export async function extractDocumentContent(attachmentId: number): Promise<DocumentContent> {
  const response = await apiClient.get<DocumentContent>(
    `/documentos/${attachmentId}/extract-content`
  )
  return response.data
}

/**
 * Extrae el contenido de un documento .docx dividido en páginas HTML
 * @param attachmentId - ID del adjunto/documento
 * @returns Páginas HTML del documento
 */
export async function extractDocumentPages(attachmentId: number): Promise<DocumentPages> {
  const response = await apiClient.get<DocumentPages>(
    `/documentos/${attachmentId}/extract-pages`
  )
  return response.data
}

/**
 * Obtiene una vista previa en texto plano del documento
 * @param attachmentId - ID del adjunto/documento
 * @param maxChars - Número máximo de caracteres (default: 200)
 * @returns Vista previa del documento
 */
export async function getDocumentPreview(
  attachmentId: number,
  maxChars: number = 200
): Promise<DocumentPreview> {
  const response = await apiClient.get<DocumentPreview>(
    `/documentos/${attachmentId}/preview`,
    {
      params: { max_chars: maxChars }
    }
  )
  return response.data
}

export default {
  extractDocumentContent,
  extractDocumentPages,
  getDocumentPreview
}
