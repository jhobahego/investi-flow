/**
 * Archivo de configuración para variables de entorno
 * Centraliza todas las variables de entorno usadas en la aplicación
 */

export const ENV = {
  // API URL con valor por defecto
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',

  // Otros posibles valores de configuración
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
}

// Función para verificar si todas las variables requeridas están presentes
export function validateEnv(): boolean {
  // Puedes agregar validación adicional según sea necesario
  if (!ENV.API_URL) {
    console.error('API_URL no está definido en las variables de entorno');
    return false;
  }

  return true;
}
