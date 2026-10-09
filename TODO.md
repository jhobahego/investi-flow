# TODO — Validación de tipos de archivo en subida (frontend)

## Contexto

El backend solo acepta `.docx` para extracción y edición de documentos
(`investi-flow-api/app/api/api_v1/documentos.py`: `extract-pages` y
`extract-content` responden `400 "Solo se pueden extraer contenidos de
archivos .docx"` ante cualquier otro tipo). Sin embargo, el frontend
permite subir PDFs (`attachmentUtils.validateFile` + UI de subida) y los
lleva al mismo editor, que termina mostrando contenido vacío con solo un
`console.warn` (`src/views/DocumentEditorView.vue:252-254`).

Evidencia del análisis: rama `feat/frontend-estrategia-pruebas-capas`,
handoff del explorer (sesión oct-2026) verificado por spot check del
orquestador contra `documentos.py:202-210` y `DocumentEditorView.vue:236-280`.

## Objetivo

Si el backend sigue siendo docx-only, el frontend debe validar en la
subida y decirlo explícitamente: no aceptar (o advertir) archivos que el
editor no va a poder mostrar.

## Alcance propuesto

1. **Validación en subida** (`src/lib/attachmentUtils.ts` + componente de
   subida):
   - Aceptar solo `.docx` (extensión + MIME
     `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
   - Rechazo temprano con mensaje visible, p. ej.: "Solo se admiten
     archivos .docx para edición en el editor".
   - Atributo `accept` en el `<input type="file">` como primera barrera.
2. **Especificarlo en la UI**: texto de ayuda junto al botón de subida
   ("Formatos admitidos: .docx") y, si aplica, en el placeholder del editor.
3. **Tests**:
   - Unitarias: `validateFile` rechaza `.pdf` y otros tipos (casos en
     `tests/unit/attachmentUtils.spec.ts`).
   - Componente: la subida muestra el error visible ante un PDF
     (`tests/components/AttachmentUpload.spec.ts`).
   - Integración: el flujo no navega al editor con un archivo rechazado.
4. **Criterio de aceptación**: subir un PDF es imposible o muestra error
   claro; `test:unit:run`, `type-check` y `build` en verde.

## Relación con la decisión de soporte PDF

Si a futuro se implementa extracción PDF en backend (opciones 1+2 del
análisis: paginado PyPDF2 + aviso de escaneado) o un visor PDF separado
(opción 3), esta validación deberá **relajarse o bifurcarse**:
PDF → visor, DOCX → editor. No endurecer la validación de forma que
bloquee esa evolución (p. ej. centralizar tipos admitidos en una
constante, no hardcodearlos en cada componente).

## Notas

- El backend es la fuente de verdad del formato admitido; el frontend
  valida por UX temprana, no por seguridad.
- No incluye OCR para PDFs escaneados (requiere decisión y dependencias
  aparte).
