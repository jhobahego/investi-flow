# Instrucciones para agentes Copilot (rápidas y accionables)

Este documento contiene la información esencial para que un agente de código (o desarrollador nuevo asistido por IA) sea productivo rápidamente en este repositorio `investi-flow-frontend`.

1) Objetivo y arquitectura a alto nivel
- **Qué hace:** frontend SPA en Vue 3 + TypeScript que orquesta proyectos tipo Kanban y un editor rico con sugerencias de IA (Lexi).
- **Componentes principales:** UI (`src/components`), vistas (`src/views`), stores Pinia (`src/stores`), router (`src/router`), integraciones API (`src/api/*`) y utilidades (`src/lib`).

2) Comandos de desarrollo y build
- **Dev server:** `npm run dev` (usa Vite).
- **Build producción:** `npm run build` (ejecuta `vue-tsc -b && vite build`).
- **Preview build:** `npm run preview`.
- **Type check:** `npm run type-check`.
- **Nota:** establecer `VITE_API_URL` para apuntar al backend cuando pruebes integraciones IA/REST.

3) Patrones y convenciones clave
- **Alias:** `@` apunta a `./src` (ver `vite.config.ts`). Importa así: `import foo from '@/lib/foo'`.
- **API client centralizado:** `src/api/client.ts` usa `axios` y expone:
  - Interceptor request que añade `Authorization: Bearer <accessToken>` desde `localStorage`.
  - Lógica de refresh con cola (`isRefreshing`, `failedQueue`) y `attemptTokenRefresh()`.
  - Manejo de errores de validación que lanza `ApiValidationError` (útil para capturar errores 422 y mostrar errores por campo).
- **Eventos de sesión:** el client puede despachar `window.dispatchEvent(new CustomEvent('session-expiring', ...))` y la UI escucha `session-continue`/`session-cancel`. Tenlo en cuenta al implementar flows que toquen autenticación.
- **Auth store:** `src/stores/auth.ts` guarda tokens en `localStorage`, usa `FormData` para login y espera endpoints `/auth/login`, `/auth/refresh`, `/users/me`.

4) Integración IA / Editor de texto
- **Archivos relevantes:** `src/api/aiService.ts`, `src/components/editor/PagedEditor.vue`, `src/composables/useAISuggestions.ts`, `docs/EDITOR_IA_INTEGRATION.md`.
- **Endpoint usado:** `POST /ia/sugerencias` via `aiService.getSuggestion(...)`. La request incluye `text`, `document_content`, `bibliography`, `project_info`.
- **Comportamiento UX:** atajo `Ctrl+Espacio` solicita sugerencia; `Tab` acepta; `Esc` rechaza. La integración actual hace autoguardado (cada 3s por defecto) y emite eventos `save`.

5) Errores y manejo esperado
- Captura `ApiValidationError` para mostrar errores por campo (ver `client.ts`). Ejemplo:
  try { await apiClient.post(...) } catch (e) { if (e instanceof ApiValidationError) { /* mostrar e.getFieldMessage('title') */ } }
- Cuando trabajes con autenticación, recuerda que el client redirige a `/login` si no hay refresh token o el refresh falla.

6) Patrones de código y TypeScript
- Proyecto usa Composition API + Pinia; los stores están en `src/stores` y devuelven funciones/refs.
- Tipos compartidos en `src/types/index.ts` — úsalo al tocar la API.
- Evitar cambios globales en alias o build sin actualizar `vite.config.ts` y `tsconfig.json`.

7) Cómo probar cambios que afectan IA/Backend
- Levanta backend apuntando `VITE_API_URL` (por ejemplo `export VITE_API_URL=http://localhost:8000`).
- Flujo rápido para probar sugerencias IA:
  - `npm run dev`
  - Iniciar sesión (o mockear tokens en `localStorage` `accessToken`/`refreshToken`)
  - Abrir una vista con editor: `/project/:id/document/edit`
  - Usar `Ctrl+Espacio` y revisar network -> `POST /ia/sugerencias`.

8) Ejemplos concretos (snippets locales)
- Llamada IA:
  - `import { aiService } from '@/api/aiService'` then `await aiService.getSuggestion({ text, document_content, bibliography, project_info })`.
- Manejo de validación:
  - `import { ApiValidationError } from '@/api/client'` → `if (err instanceof ApiValidationError) { const msg = err.getFieldMessage('field') }`.

9) Archivos y docs de referencia rápida
- `vite.config.ts` (alias `@`)
- `package.json` (scripts)
- `src/api/client.ts` (token refresh, ApiValidationError)
- `src/api/aiService.ts` (interfaz IA)
- `src/components/editor/PagedEditor.vue` y `docs/EDITOR_IA_INTEGRATION.md` (UX y flows de IA)
- `src/stores/auth.ts` (login/refresh/logout pattern)

10) Qué evitar / notas útiles
- No inventes endpoints: usa los que ya aparecen en `aiService` y `client`. Si necesitas uno nuevo, confirma con el equipo backend.
- No supongas persistencia del editor en backend (docs indican que aún no está guardado permanentemente).

11) Convenciones de Git y Commits
- **Granularidad:** Commits pequeños y atómicos. Un commit por funcionalidad o fix.
- **Formato:** Conventional Commits en español: `<tipo>(<scope>): <descripción corta>`
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
  - Ejemplos reales del repo:
    - `feat(editor): integrar panel de bibliografía en vista de documentos`
    - `fix(stores): corregir manejo de respuesta 304 en cache`
    - `refactor(ui): usar propiedad computed para consistencia`
- **Longitud:** Máximo 60-72 caracteres en el título. Sin punto final.

Feedback: ¿alguna sección poco clara o necesitas que añada ejemplos más concretos (PR template, reglas de commit, tests)?
