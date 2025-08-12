# Lista de Tareas Pendientes - InvestiFlow

## 📋 Estado de Implementación de Funcionalidades

### ✅ Funcionalidades Completadas
- [x] Frontend completo con Vue 3 + TypeScript
- [x] Sistema de autenticación básico (mock)
- [x] Gestión de proyectos con tablero Kanban
- [x] Sistema de tareas con bloques de contenido
- [x] Asistente de IA (Lexi) simulado
- [x] Interfaz moderna con TailwindCSS
- [x] Responsive design básico
- [x] Navegación y routing
- [x] Sistema de fases de investigación predefinidas

### 🚧 Funcionalidades Críticas Faltantes

#### 📎 Sistema de Gestión de Archivos
- [ ] Componente de carga de archivos (FileUpload) para tareas
- [ ] Interfaz para adjuntar documentos a cada tarea
- [ ] Preview de archivos adjuntos (PDF, DOC, TXT)
- [ ] Sistema de versiones de documentos
- [ ] Almacenamiento local/temporal para archivos (sin backend)
- [ ] Validación de tipos de archivo permitidos
- [ ] Límites de tamaño de archivo

#### 📝 Editor de Documentos Básico
- [ ] Editor de texto simple para cada tarea (sin ser robusto)
- [ ] Funcionalidad de autoguardado local
- [ ] Formato básico de texto (negrita, cursiva, listas)
- [ ] Exportación a formatos básicos (TXT, MD)
- [ ] Vista previa del documento en construcción
- [ ] Contador de palabras y caracteres

#### 🤖 Mejoras al Sistema de IA (sin backend)
- [ ] Contexto de archivos adjuntos para sugerencias de IA
- [ ] Análisis simulado de contenido de documentos
- [ ] Generación de citas bibliográficas simuladas
- [ ] Sugerencias de estructura de documento
- [ ] Detección simulada de plagio básica
- [ ] Recomendaciones de mejora de escritura

#### 📚 Sistema de Bibliografía y Citas
- [ ] Gestor de referencias bibliográficas
- [ ] Formularios para agregar fuentes manualmente
- [ ] Formatos de citación (APA, MLA, Chicago)
- [ ] Generador automático de bibliografía
- [ ] Importación básica de referencias desde texto
- [ ] Verificación de formato de citas

#### 👥 Mejoras en Colaboración
- [ ] Sistema de comentarios en tareas
- [ ] Notificaciones locales de actividad
- [ ] Historial de cambios en tareas
- [ ] Sistema de permisos más granular
- [ ] Invitación de colaboradores por email (mock)
- [ ] Chat básico por proyecto

#### 📊 Dashboard y Reportes
- [ ] Dashboard de progreso del proyecto
- [ ] Métricas de productividad
- [ ] Gráficos de avance por fase
- [ ] Reportes de tiempo dedicado
- [ ] Estadísticas de uso de la plataforma
- [ ] Exportación de reportes en PDF

#### 🔧 Configuración y Personalización
- [ ] Configuración de perfil de usuario extendida
- [ ] Personalización de fases de investigación
- [ ] Templates de proyectos predefinidos
- [ ] Configuración de notificaciones
- [ ] Temas de interfaz (modo oscuro/claro)
- [ ] Configuración de idioma

#### 🔍 Búsqueda y Filtros
- [ ] Búsqueda global en proyectos y tareas
- [ ] Filtros avanzados por fase, fecha, colaborador
- [ ] Búsqueda dentro del contenido de tareas
- [ ] Etiquetas para organizar tareas
- [ ] Búsqueda por palabras clave

#### 🗂️ Organización Avanzada
- [ ] Sistema de etiquetas/tags para tareas
- [ ] Prioridades de tareas (alta, media, baja)
- [ ] Fechas límite para tareas
- [ ] Recordatorios y alertas
- [ ] Archivado de proyectos completados
- [ ] Duplicación de proyectos como templates

#### 📱 Mejoras de UX/UI
- [ ] Onboarding para nuevos usuarios
- [ ] Tours guiados de la plataforma
- [ ] Shortcuts de teclado
- [ ] Modo offline básico
- [ ] Mejoras de accesibilidad (ARIA)
- [ ] Animaciones mejoradas

#### 🔐 Seguridad y Validación
- [ ] Validación de formularios más robusta
- [ ] Sistema de recuperación de contraseña (mock)
- [ ] Validación de fortaleza de contraseñas
- [ ] Sesiones con expiración
- [ ] Protección contra ataques comunes

#### 📤 Exportación e Importación
- [ ] Exportación completa de proyectos
- [ ] Importación de proyectos desde archivo
- [ ] Exportación de documentos en múltiples formatos
- [ ] Backup y restauración de datos
- [ ] Sincronización con servicios de almacenamiento

### 🎯 Funcionalidades de Prioridad Alta (Implementar Primero)

#### 1. Sistema de Archivos Básico
- [ ] Crear componente FileUpload.vue
- [ ] Modificar Task interface para incluir attachments
- [ ] Implementar vista previa de archivos
- [ ] Agregar validaciones de archivo

#### 2. Editor de Texto Simple
- [ ] Crear componente SimpleEditor.vue
- [ ] Integrar editor en las tareas
- [ ] Implementar autoguardado local
- [ ] Agregar exportación básica

#### 3. Mejoras al Sistema de IA
- [ ] Mejorar contexto de sugerencias basado en archivos
- [ ] Agregar análisis simulado de contenido
- [ ] Implementar generación de citas

#### 4. Sistema de Bibliografía
- [ ] Crear componente BibliographyManager.vue
- [ ] Implementar formularios de referencias
- [ ] Agregar formatos de citación
- [ ] Crear generador de bibliografía

### 🔮 Funcionalidades Futuras (Requieren Backend)
- [ ] Integración real con API de IA (Gemini)
- [ ] Búsqueda bibliográfica automatizada
- [ ] Colaboración en tiempo real
- [ ] Almacenamiento persistente en base de datos
- [ ] Autenticación JWT real
- [ ] API REST completa
- [ ] Sistema de notificaciones push

### 📈 Métricas de Progreso
- **Funcionalidades Completadas**: 9/50+ (18%)
- **Funcionalidades Críticas Faltantes**: 41
- **Prioridad Alta**: 12 tareas
- **Funcionalidades Futuras**: 7 tareas

### 🎯 Próximos Pasos Recomendados

1. **Implementar sistema de archivos** - Esencial para que las tareas puedan tener documentos adjuntos
2. **Crear editor básico** - Permitir edición de contenido dentro de la plataforma
3. **Mejorar sistema de IA** - Hacer que Lexi pueda analizar archivos adjuntos
4. **Agregar sistema de bibliografía** - Fundamental para investigación académica
5. **Implementar mejoras de UX** - Onboarding y tours guiados

### 📝 Notas de Implementación

- **Priorizar funcionalidades que no requieren backend** para mantener el proyecto funcional
- **Usar localStorage** para persistencia temporal de datos
- **Implementar validaciones robustas** en el frontend
- **Mantener la arquitectura modular** para facilitar futuras integraciones
- **Documentar cada nueva funcionalidad** para facilitar el mantenimiento

---

**Última actualización**: 29 de julio de 2025
**Estado del proyecto**: En desarrollo activo
**Próxima revisión**: Al completar las 4 funcionalidades de prioridad alta
