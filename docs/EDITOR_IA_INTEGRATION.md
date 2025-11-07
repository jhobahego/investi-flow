# Editor de Documentos con IA 🚀

Documentación completa de la integración del editor rico con sugerencias de IA usando TipTap y Google Gemini.

## 📚 Características Implementadas

### ✨ Editor Rico (TipTap)
- ✅ Editor WYSIWYG moderno y profesional
- ✅ Formato de texto: **Negrita**, *Cursiva*, <u>Subrayado</u>
- ✅ Títulos H1, H2, H3
- ✅ Listas con viñetas y numeradas
- ✅ Enlaces
- ✅ Placeholder personalizado
- ✅ Contador de palabras y caracteres en tiempo real

### 🤖 Sugerencias de IA
- ✅ Integración con Google Gemini API
- ✅ Sugerencias contextuales basadas en:
  - Texto actual del usuario
  - Documento completo
  - Bibliografía del proyecto
  - Información del proyecto
- ✅ Atajo de teclado: `Ctrl+Espacio`
- ✅ Botón visual "💡 Sugerencia IA" en toolbar
- ✅ Popup de aceptar/rechazar sugerencia
- ✅ Manejo de errores y loading states

### 💾 Autoguardado
- ✅ Guardado automático cada 3 segundos
- ✅ Indicador de última vez guardado
- ✅ Botón manual de guardado

## 🗂️ Estructura de Archivos

```
investi-flow-frontend/src/
├── api/
│   └── aiService.ts                    # Cliente API para sugerencias
├── components/
│   └── editor/
│       └── RichTextEditor.vue          # Componente principal del editor
├── composables/
│   └── useAISuggestions.ts             # Lógica de sugerencias IA
├── views/
│   └── DocumentEditorView.vue          # Vista completa del editor
└── router/
    └── index.ts                        # Ruta: /project/:id/document/edit
```

## 🚀 Cómo Usar

### Acceso al Editor

1. **Desde un proyecto:**
   - Ve al proyecto
   - Haz clic en el botón de "ojo" (👁️) en el adjunto de una tarea/fase
   - Se abrirá el editor en `/project/:id/document/edit`

2. **Parámetros de URL:**
   ```
   /project/123/document/edit?entityType=task&entityId=456
   ```

### Uso del Editor

#### Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+B` | Negrita |
| `Ctrl+I` | Cursiva |
| `Ctrl+U` | Subrayado |
| `Ctrl+Espacio` | Solicitar sugerencia IA |
| `Tab` | Aceptar sugerencia |
| `Esc` | Rechazar sugerencia |

#### Flujo de Sugerencias IA

1. **Escribe algo en el editor**
   ```
   "Los resultados del experimento muestran que"
   ```

2. **Presiona `Ctrl+Espacio` o haz clic en "💡 Sugerencia IA"**
   - Se muestra "⏳ Generando..."
   - Se envía al backend:
     - Últimos 500 caracteres antes del cursor
     - Documento completo
     - Bibliografía del proyecto
     - Info del proyecto

3. **La IA devuelve una sugerencia:**
   ```
   "existe una correlación significativa entre el uso de 
   herramientas digitales y el rendimiento académico."
   ```

4. **El texto se inserta automáticamente y se selecciona**
   - Aparece un popup: "✨ Sugerencia de IA"
   - Botones: "✓ Aceptar (Tab)" / "✕ Rechazar (Esc)"

5. **Acepta o rechaza:**
   - `Tab` o clic en "Aceptar": mantiene el texto
   - `Esc` o clic en "Rechazar": elimina el texto

## 🔌 Integración con el Backend

### Endpoint Usado

```typescript
POST /api/v1/ia/sugerencias
```

**Request:**
```json
{
  "text": "Los resultados del experimento muestran que",
  "document_content": "# Introducción\n\n...\n\nLos resultados...",
  "bibliography": [
    {
      "autores": "García, M. & López, A.",
      "anio": 2023,
      "titulo": "IA en educación superior",
      "tipo": "articulo"
    }
  ],
  "project_info": {
    "name": "Impacto de la IA en educación",
    "research_type": "experimental"
  }
}
```

**Response:**
```json
{
  "suggestion": "existe una correlación significativa...",
  "model_used": "gemini-2.0-flash-lite"
}
```

## 🎨 Componentes

### RichTextEditor.vue

**Props:**
- `modelValue` (string): Contenido HTML del editor
- `projectId` (number, opcional): ID del proyecto
- `bibliography` (array, opcional): Bibliografía del proyecto
- `projectInfo` (object, opcional): Info del proyecto
- `placeholder` (string): Texto placeholder
- `autosave` (boolean): Activar autoguardado
- `autosaveDelay` (number): Delay en ms para autoguardar

**Eventos:**
- `update:modelValue`: Emitido cuando cambia el contenido
- `save`: Emitido cuando se autguarda

**Ejemplo de uso:**
```vue
<RichTextEditor 
  v-model="content"
  :project-id="123"
  :bibliography="bibliographyList"
  :project-info="{ name: 'Mi Proyecto' }"
  :autosave="true"
  :autosave-delay="3000"
  @save="handleSave"
/>
```

### useAISuggestions.ts

Composable que maneja la lógica de sugerencias de IA.

**Uso:**
```typescript
const {
  isLoading,           // boolean: cargando sugerencia
  suggestion,          // string | null: sugerencia actual
  error,               // string | null: error si hay
  requestSuggestion,   // function: solicitar sugerencia
  acceptSuggestion,    // function: aceptar sugerencia
  rejectSuggestion,    // function: rechazar sugerencia
  clearSuggestion      // function: limpiar estado
} = useAISuggestions(editor)

// Solicitar sugerencia
await requestSuggestion(bibliography, projectInfo)

// Aceptar
acceptSuggestion()

// Rechazar
rejectSuggestion()
```

## 🔧 Configuración

### Extensiones de TipTap Instaladas

```bash
npm install @tiptap/vue-3 @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder
npm install @tiptap/extension-underline
npm install @tiptap/extension-link
npm install @tiptap/extension-history
```

### Personalización del Editor

Puedes agregar más extensiones en `RichTextEditor.vue`:

```typescript
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
// ... más extensiones

const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder,
    Underline,
    Link,
    // Agrega aquí más extensiones
  ]
})
```

## 📊 Próximas Mejoras

### Fase 2: Mejoras Planificadas
- [ ] Streaming de sugerencias (SSE)
- [ ] Sugerencias automáticas con debouncing
- [ ] Selector visual de bibliografía
- [ ] Export a PDF
- [ ] Comentarios y anotaciones
- [ ] Modo de comparación de versiones
- [ ] Colaboración en tiempo real

### Fase 3: Características Avanzadas
- [ ] Plantillas de documentos
- [ ] Detección de plagio
- [ ] Análisis de legibilidad
- [ ] Sugerencias de estructura
- [ ] Integración con Zotero/Mendeley

## 🐛 Troubleshooting

### "Cannot find module '@/api/aiService'"
- Verifica que el archivo existe en `src/api/aiService.ts`
- Si usas alias `@`, verifica `tsconfig.json`

### "Property 'undo' does not exist"
- Asegúrate de tener instalado `@tiptap/extension-history`
- El StarterKit ya incluye History por defecto

### Sugerencias no se muestran
1. Verifica que el backend está corriendo
2. Revisa la consola del navegador
3. Verifica que tienes token de autenticación válido
4. Verifica que el endpoint `/api/v1/ia/sugerencias` responde

### El editor no guarda
- El autoguardado actualmente solo emite el evento `@save`
- Necesitas implementar la lógica de guardado en el backend
- Por ahora, los cambios se guardan en `localStorage` temporalmente

## 📝 Notas Importantes

### Backend Actual
⚠️ **El backend NO guarda el contenido HTML del editor todavía**

Por implementar:
1. Nuevo campo en modelo `Document` o `Attachment`:
   ```python
   content: str | None  # Contenido HTML del editor
   ```

2. Nuevo endpoint o actualizar existente:
   ```python
   PATCH /api/v1/proyectos/{project_id}/documentos/{document_id}
   {
     "content": "<h1>Mi documento</h1><p>..."
   }
   ```

### Bibliografía
Por ahora, la bibliografía se pasa como prop vacía `[]`.

Cuando implementes el módulo de bibliografías:
```typescript
const bibliography = computed(() => {
  return bibliographiesStore.getProjectBibliographies(projectId.value)
})
```

## 🎯 Resumen

✅ **YA FUNCIONA:**
- Editor rico con TipTap
- Sugerencias de IA con Ctrl+Espacio
- Integración con endpoint del backend
- Popup de aceptar/rechazar
- Contador de palabras
- Navegación desde AttachmentUpload

⚠️ **PENDIENTE:**
- Guardado real del contenido en backend
- Carga del contenido HTML desde backend
- Integración con bibliografías
- Export a PDF

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa los logs de la consola del navegador
2. Verifica que el backend está corriendo
3. Revisa la documentación de TipTap: https://tiptap.dev
4. Revisa la documentación del endpoint de IA en el backend

---

**Creado:** Octubre 27, 2025
**Última actualización:** Octubre 27, 2025
