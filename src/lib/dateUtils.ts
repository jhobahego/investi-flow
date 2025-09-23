/**
 * Utilidades para el manejo de fechas entre el frontend y backend
 */

/**
 * Convierte una fecha en formato YYYY-MM-DD a formato datetime ISO para enviarla al backend
 * @param dateString - Fecha en formato YYYY-MM-DD o null
 * @returns Fecha en formato ISO datetime o null
 */
export const formatDateToISO = (dateString: string | null): string | null => {
  if (!dateString) return null
  // Si ya es un datetime completo, devolverlo tal como está
  if (dateString.includes('T')) return dateString
  // Si es solo una fecha, agregar hora por defecto (00:00:00 UTC)
  return `${dateString}T00:00:00.000Z`
}

/**
 * Convierte una fecha en formato ISO datetime a formato YYYY-MM-DD para mostrarla en inputs tipo date
 * @param isoString - Fecha en formato ISO datetime o null
 * @returns Fecha en formato YYYY-MM-DD o null
 */
export const formatISOToDate = (isoString: string | null): string | null => {
  if (!isoString) return null
  // Si ya es solo una fecha, devolverla tal como está
  if (!isoString.includes('T')) return isoString
  // Si es un datetime ISO, extraer solo la fecha
  return isoString.split('T')[0]
}

/**
 * Convierte una fecha ISO a formato legible para mostrar al usuario
 * @param isoString - Fecha en formato ISO datetime
 * @param locale - Locale para formatear la fecha (por defecto 'es-ES')
 * @returns Fecha formateada para mostrar
 */
export const formatDateForDisplay = (isoString: string | null, locale: string = 'es-ES'): string | null => {
  if (!isoString) return null
  
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date for display:', error)
    return isoString
  }
}

/**
 * Convierte una fecha ISO a formato datetime legible para mostrar al usuario
 * @param isoString - Fecha en formato ISO datetime
 * @param locale - Locale para formatear la fecha (por defecto 'es-ES')
 * @returns Datetime formateada para mostrar
 */
export const formatDateTimeForDisplay = (isoString: string | null, locale: string = 'es-ES'): string | null => {
  if (!isoString) return null
  
  try {
    const date = new Date(isoString)
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting datetime for display:', error)
    return isoString
  }
}