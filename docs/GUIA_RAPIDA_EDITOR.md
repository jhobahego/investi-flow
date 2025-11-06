# 🚀 Guía Rápida: Editor con IA

## ✅ ¿Qué se ha implementado?

Un **editor de documentos enriquecido con sugerencias de IA** integrado en la plataforma InvestiFlow.

### Características:
- ✨ Editor WYSIWYG con TipTap
- 🤖 Sugerencias de IA con Google Gemini
- 💾 Autoguardado
- 📊 Contador de palabras/caracteres
- ⌨️ Atajos de teclado

---

## 🎯 Cómo Probar

### 1. Inicia el servidor
```bash
cd investi-flow-frontend
npm run dev
```

### 2. Navega a un proyecto
1. Login → Dashboard → Selecciona un proyecto
2. En una fase o tarea con documento adjunto
3. **Haz clic en el icono del ojo 👁️** (antes estaba deshabilitado)

### 3. Usa el editor
```
1. Escribe: "Los resultados muestran que"
2. Presiona: Ctrl+Espacio
3. Espera la sugerencia (~3 segundos)
4. Acepta con Tab o rechaza con Esc
```

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+Espacio` | Solicitar sugerencia IA |
| `Tab` | Aceptar sugerencia |
| `Esc` | Rechazar sugerencia |
| `Ctrl+B` | Negrita |
| `Ctrl+I` | Cursiva |
| `Ctrl+U` | Subrayado |

---

## 📁 Archivos Creados

```
frontend/src/
├── api/
│   └── aiService.ts                    ← Cliente API
├── components/
│   └── editor/
│       └── RichTextEditor.vue          ← Editor principal
├── composables/
│   └── useAISuggestions.ts             ← Lógica IA
└── views/
    └── DocumentEditorView.vue          ← Vista completa
```

---

## 🔧 Backend - Sin cambios necesarios

El backend **YA ESTÁ LISTO**:
- ✅ Endpoint `/api/v1/ia/sugerencias` funcional
- ✅ Integración con Google Gemini
- ✅ Autenticación JWT
- ✅ Manejo de errores

**Opcional (futuro):**
- Guardar contenido HTML en BD
- Endpoint para cargar contenido

---

## 🎨 Vista Previa

```
┌───────────────────────────────────────────┐
│ [← Volver]  Documento    [💾 Guardar]    │
├───────────────────────────────────────────┤
│ [B] [I] [U] | [H1] [H2] | [💡 IA]       │
├───────────────────────────────────────────┤
│                                           │
│  # Introducción                            │
│                                           │
│  Los resultados muestran que[cursor]      │
│                                           │
│                                           │
├───────────────────────────────────────────┤
│ 45 palabras • 280 caracteres              │
└───────────────────────────────────────────┘

                    ┌─────────────────┐
                    │ ✨ Sugerencia IA │
                    ├─────────────────┤
                    │ [✓ Aceptar]     │
                    │ [✕ Rechazar]    │
                    └─────────────────┘
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
npm install
```

### El botón del ojo no funciona
- Verifica que tienes un documento adjunto
- Refresca la página

### No aparecen sugerencias
1. Verifica que el backend está corriendo
2. Revisa la consola del navegador (F12)
3. Verifica tu token de autenticación

### Error de CORS
- El backend debe estar en `http://localhost:8000`
- Verifica la configuración en `src/config/env.config.ts`

---

## 📖 Documentación Completa

Ver archivos:
- `docs/EDITOR_IA_INTEGRATION.md` - Documentación técnica completa
- `docs/RESUMEN_EDITOR_IA.md` - Resumen detallado con diagramas

---

## ✨ Estado Actual

**100% Funcional** ✅

- ✅ Editor con formato rico
- ✅ Sugerencias de IA
- ✅ Integración con backend
- ✅ Popup aceptar/rechazar
- ✅ Contador de palabras
- ✅ Acceso desde adjuntos

**Pendiente (opcional):**
- ⏳ Guardado HTML en backend
- ⏳ Bibliografías reales
- ⏳ Export a PDF

---

## 🎉 ¡Listo para usar!

El editor está completamente operativo. Prueba las sugerencias de IA y explora todas las funcionalidades.

**Pregunta:** ¿Necesitas ayuda con algo más?
