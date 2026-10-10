import { FileType } from '../types'

// Tamaño máximo permitido: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Tipos de archivo permitidos.
// Upload is docx-only: the backend is the source of truth (extraction/editing
// endpoints reject non-.docx). Allowed lists stay centralized here so a future
// PDF->viewer / DOCX->editor split only touches these constants.
export const ALLOWED_FILE_TYPES = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Extensiones permitidas
export const ALLOWED_EXTENSIONS = ['.docx']

/**
 * Valida si un archivo es válido según tipo y tamaño
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${formatFileSize(MAX_FILE_SIZE)}`
    }
  }

  // Validar tipo MIME
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de archivo no permitido. Solo se admiten archivos .docx para edición en el editor'
    }
  }

  // Validar extensión como fallback
  const extension = getFileExtension(file.name).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: 'Extensión de archivo no permitida. Solo se admiten archivos .docx para edición en el editor'
    }
  }

  return { isValid: true }
}

/**
 * Formatea el tamaño de archivo en bytes a formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Obtiene la extensión de un archivo
 */
export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return ''
  return filename.slice(dotIndex)
}

/**
 * Obtiene el icono CSS class según el tipo de archivo
 */
export function getFileIcon(fileType: FileType): string {
  switch (fileType) {
    case FileType.PDF:
      return 'text-red-600' // Color rojo para PDF
    case FileType.DOCX:
      return 'text-blue-600' // Color azul para DOCX
    default:
      return 'text-gray-600'
  }
}

/**
 * Obtiene el nombre del icono de Heroicons según el tipo de archivo
 */
export function getFileIconName(fileType: FileType): string {
  switch (fileType) {
    case FileType.PDF:
    case FileType.DOCX:
      return 'DocumentTextIcon'
    default:
      return 'DocumentIcon'
  }
}

/**
 * Genera URL de descarga para un documento
 */
export function getDownloadUrl(filePath: string): string {
  // Asumiendo que el backend sirve archivos estáticos desde /files/
  // Ajustar según la configuración real del backend
  return `/api/v1/files/${filePath}`
}

/**
 * Trunca el nombre de archivo si es muy largo
 */
export function truncateFileName(fileName: string, maxLength: number = 25): string {
  if (fileName.length <= maxLength) return fileName
  
  const extension = getFileExtension(fileName)
  const dotIndex = fileName.lastIndexOf('.')
  const nameWithoutExt = dotIndex === -1 ? fileName : fileName.slice(0, dotIndex)
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 3)
  
  return `${truncatedName}...${extension}`
}

/**
 * Obtiene el tipo de archivo desde la extensión
 */
export function getFileTypeFromExtension(filename: string): FileType | null {
  const extension = getFileExtension(filename).toLowerCase()
  
  switch (extension) {
    case '.pdf':
      return FileType.PDF
    case '.docx':
      return FileType.DOCX
    default:
      return null
  }
}

/**
 * Verifica si un archivo es una imagen (para futuras expansiones)
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/')
}

/**
 * Obtiene el color del tipo de archivo para UI
 */
export function getFileTypeColor(fileType: FileType): string {
  switch (fileType) {
    case FileType.PDF:
      return 'bg-red-100 text-red-800'
    case FileType.DOCX:
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}