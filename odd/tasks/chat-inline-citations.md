# Feature: chat-inline-citations — Citas inline interactivas y no invasivas en Chat con Lexi

## Objective
Transformar las referencias inline con formato `[Fragmento N | NombreDocumento]` en las respuestas de Lexi (`ChatView.vue`) en chips/indicadores superíndice compactos, sutiles e interactivos que muestren una vista previa ligera al pasar el cursor o enfocar, y al hacer clic expandan y resalten el fragmento correspondiente en `ChatSources.vue` ("Fuentes consultadas").

## Problem
Actualmente `ChatView.vue` renderiza el Markdown de Lexi con `marked.parse(content)` tal cual, por lo que citas como `[Fragmento 5 | Trabajo finalizado.docx]` aparecen como texto plano extenso dentro de cada oración, rompiendo la fluidez de lectura sin conectar visualmente con el panel colapsable `Fuentes consultadas` (`ChatSources.vue`).

## Why
El usuario solicitó convertir estas referencias en citas interactivas vinculadas a "Fuentes consultadas", priorizando que la experiencia visual sea lo menos invasiva posible durante la lectura.

## Scope
- Parseo, normalización y resolución determinística de citas `[Fragmento N | archivo]` contra `DocumentSource[]` en un módulo puro (`src/lib/chatCitations.ts`), respetando bloques de código/inline code y previniendo XSS.
- Componente `src/components/ui/ChatMessageContent.vue` para renderizar Markdown sanitizado con `v-dompurify-html`, chips superíndice minimalistas, vista previa ligera en hover/focus (con tecla `Escape` para cerrar) y emisión de selección de fuente.
- Actualización de `src/components/ui/ChatSources.vue` para soportar resaltado de fuente activa, auto-expansión controlada al seleccionar una cita y numeración discreta de fragmentos manteniendo 100% compatibilidad con el uso actual.
- Integración por mensaje en `src/views/ChatView.vue`.
- Pruebas unitarias y de componentes en Vitest (TDD: RED → GREEN → REFACTOR) verificando sanitización real con `vue-dompurify-html`.

## Constraints
- Vue 3 Composition API (`<script setup lang="ts">`) + TypeScript estricto + Tailwind CSS; sin dependencias nuevas.
- Sanitización obligatoria con `v-dompurify-html` (nunca `v-html` crudo).
- Diseño visual sobrio, discreto y no invasivo (sin alterar el interlineado del párrafo).
- Accesibilidad WCAG 2.2: botones nativos enfocables por teclado, `aria-label` en español, foco visible y cierre de tooltip con `Escape`.
- Textos visibles al usuario en español.
- Preservar intactos archivos no relacionados del workspace (`PROMPT-RAG-INTEGRATION.md`, `openapi.json`, etc.).
- Respetar política del repositorio (`AGENTS.md`): sin commits ni push automáticos salvo instrucción explícita del usuario.

## Checklist
- [x] T1 Módulo puro `src/lib/chatCitations.ts` + pruebas unitarias `tests/unit/chatCitations.spec.ts` (parseo de `[Fragmento N | archivo]`, resolución contra `DocumentSource[]`, exclusión en `code`/`pre`, escape HTML, tablas GFM con pipe dentro de citas y links Markdown intactos).
- [x] T2 Componentes `src/components/ui/ChatMessageContent.vue`, `src/components/ui/ChatSources.vue` e integración en `src/views/ChatView.vue` (chips superíndice no invasivos, tooltip ligero en hover/focus con cierre por `Escape`, auto-expansión y resaltado suave en `Fuentes consultadas` por mensaje).
- [x] T3 Pruebas de componentes (`tests/components/ChatMessageContent.spec.ts`, ampliación de `tests/unit/components/ChatSources.spec.ts`) y verificación completa (`npm run type-check`, `npm run test:unit:run`, `npm run build`).

## Authorized Scope
- `src/lib/chatCitations.ts` (nuevo)
- `src/components/ui/ChatMessageContent.vue` (nuevo)
- `src/components/ui/ChatSources.vue`
- `src/views/ChatView.vue`
- `tests/unit/chatCitations.spec.ts` (nuevo)
- `tests/unit/components/ChatSources.spec.ts`
- `tests/components/ChatMessageContent.spec.ts` (nuevo)
- `odd/tasks/chat-inline-citations.md`

## Acceptance Criteria
1. Citas como `[Fragmento 5 | Trabajo finalizado.docx]` se muestran inline como chips numéricos compactos y discretos (`5`) sin romper el interlineado ni saturar el texto.
2. Al pasar el cursor o enfocar un chip, se muestra una vista previa ligera (nombre del documento, fragmento, similitud y extracto si coincide con `sources`), cerrable con `Escape`.
3. Al hacer clic en un chip vinculado a una fuente, el panel `Fuentes consultadas` de ese mensaje se abre automáticamente y resalta sutilmente la fuente correspondiente.
4. Citas dentro de bloques de código o código inline no se transforman; enlaces Markdown estándar `[texto](url)` siguen funcionando igual; nombres de archivo con HTML malicioso son sanitizados por `v-dompurify-html`.
5. Citas sin coincidencia exacta en `sources` siguen renderizándose limpiamente con tooltip del documento sin errores.
6. `npm run type-check`, `npm run test:unit:run` y `npm run build` pasan sin errores.

## Applicable Checks
- TDD (RED → GREEN → REFACTOR) con Vitest (`npx vitest run ...`).
- `npm run type-check` (`vue-tsc --build --force`)
- `npm run test:unit:run` (Vitest)
- `npm run build` (`vue-tsc -b && vite build`)

## Route
- Delegated direct (un bounded writer).
- Trigger evidence: implementación multi-archivo no trivial (`src/lib/chatCitations.ts`, `src/components/ui/ChatMessageContent.vue`, `src/components/ui/ChatSources.vue`, `src/views/ChatView.vue` y 3 archivos de pruebas).
- Risk tier: Medium (writer self-verification + parent spot check).

## Delivery Strategy
- Strategy: `single-pr` (estimado ~320-380 líneas autorales, bajo el umbral de ~400 líneas; commits/PR diferidos a instrucción del usuario según `AGENTS.md`).

## Progress
- T1–T3 completados siguiendo TDD (RED → GREEN → REFACTOR).
- Evidencia de verificación observada:
  - `npm run type-check`: pasó (exit code 0, `vue-tsc --build --force` sin errores).
  - `npm run test:unit:run`: pasó (`Test Files 24 passed (24)`, `Tests 256 passed (256)` — incluye 12 pruebas en `tests/unit/chatCitations.spec.ts`, 6 en `tests/components/ChatMessageContent.spec.ts` con `VueDOMPurifyHTML` real y 5 en `tests/unit/components/ChatSources.spec.ts`).
  - `npm run build`: pasó (`vue-tsc -b && vite build`, `✓ built in 29.77s`).
- Nota técnica: se añadió escape selectivo de `|` dentro de citas `[Fragmento N | archivo]` en filas de tablas GFM (fuera de bloques/spans de código) para que las citas dentro de celdas de tabla no rompan las columnas antes de la tokenización inline.

## Next Step
Spot check del coordinador y entrega al usuario (sin commit ni push automáticos según `AGENTS.md`).
