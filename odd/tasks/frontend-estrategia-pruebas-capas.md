# Feature: estrategia de pruebas frontend por capas (Vitest + MSW + Playwright)

- Locator (repo-relative): `odd/tasks/frontend-estrategia-pruebas-capas.md`
- Branch: `feat/frontend-estrategia-pruebas-capas` (base: `develop`)
- Estrategia fuente: `../../estrategia-pruebas-frontend-vue3.md` (raíz del proyecto, fuera de este repo)
- Engram mirror: `odd/frontend-estrategia-pruebas-capas/tasks` — estado: **pending** (store ambiguo desde el cwd padre con dos repos; reintentar al cierre)
- Baseline verificado: `npm run type-check` OK, `npm run build` OK (19s) sobre la rama nueva, árbol limpio.

## Objective

Dotar al frontend Investi Flow (Vue 3 + TS + Vite 5.4.2, Pinia, Vue Router, axios) de pruebas automatizadas por capas, empezando por la lógica y los flujos críticos, con comandos documentados y sin datos de producción.

## Problem / Why

El frontend no tiene ningún directorio `tests/` ni dependencias de test (`package.json` solo tiene scripts `dev/build/preview/type-check`). Cualquier refactorización de stores, componentes o servicios HTTP hoy no tiene red de regresiones. La estrategia define 5 capas; esta feature la ejecuta en orden, con una primera iteración que cierra con el criterio de finalización inicial de la estrategia.

## Scope

Incluye: instalación de dependencias de test, configuración de Vitest/Playwright, suites unitarias, de componentes, de stores, de integración con MSW, E2E mínimos en Chromium, escenarios neutrales, scripts `package.json`, workflow de CI y documentación de comandos.

No incluye: actualizar Vite 5 → 6 ni Vitest 5 (se usa Vitest 3.2.x a propósito); TesterArmy (solo preparación de carpeta/escenarios); cambios de comportamiento de producción; credenciales o backend de pruebas real (E2E contra dev local con datos aislados).

## Constraints

- Vitest `^3.2.4` + `@vitest/coverage-v8@^3.2.4` (NO Vitest 5: exige Vite ≥ 6.4). Node local v24 OK.
- Conservar plugins, alias `@` y opciones actuales de `vite.config.ts`; importar `defineConfig` desde `vitest/config`.
- `tsconfig.app.json` no declara `paths:@/*`: resolver el alias también para Vitest si hace falta.
- Riesgos jsdom conocidos: `localStorage`, `window.location.href`, `CustomEvent session-*`, `File/Blob`, `import.meta.env.VITE_API_URL` (stub), Tiptap/ProseMirror (evitar o mockear `Editor`; no acoplar tests a internos).
- Test-first por defecto: RED → GREEN → REFACTOR donde haya runner determinista y resultado esperado claro. Excepción registrada: T0 (infra sin RED significativo) y T5 (E2E contra navegador) usan verificación funcional/estructural proporcional en su lugar.
- Un solo writer a la vez; commits por unidad de trabajo en la rama feature con Conventional Commits; push/PR/merge los decide el usuario.

## Delivery strategy

`single-pr`: solo se añaden config + tests, sin cambios de comportamiento en producción. Si el acumulado superara el presupuesto de entrega (~400 líneas autoradas), se trocea con la skill `chained-pr` antes del PR. Forecast inicial: >400 líneas nuevas (mayoría tests), aceptado y explicado: los tests son el entregable.

## Checklist (IDs estables)

- [x] **T0 — Infraestructura de test (Capa 0, §§1–3).** Route: delegated direct (writer trigger: 5+ archivos nuevos/editados).
  - Instalar: `vitest@^3.2.4 @vitest/coverage-v8@^3.2.4 @vue/test-utils@^2 jsdom msw @playwright/test`; `npx playwright install chromium` (solo chromium).
  - Estructura `tests/{setup.ts,mocks/,unit/,components/,integration/,e2e/playwright/,e2e/scenarios/}`.
  - Bloque `test` en `vite.config.ts` (include unit/components/integration, jsdom, setupFiles, clear/restoreMocks, coverage v8 con include `src/**/*.{ts,vue}`, exclude `src/main.ts` y `*.d.ts`).
  - Scripts: `test:unit`, `test:unit:run`, `test:coverage`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`.
  - `playwright.config.ts` (Chromium, baseURL 127.0.0.1:5173, webServer `npm run dev`).
  - Un smoke spec mínimo que pruebe el runner.
  - Acceptance: `test:unit:run` en verde, `type-check` y `build` en verde.
- [x] **T1 — Unitarias (Capa 1, §4).** Route: delegated direct. Suites Arrange–Act–Assert para `src/lib/dateUtils.ts`, `src/lib/attachmentUtils.ts`, `src/lib/utils.ts` (normales, límites, inválidos/errores). Acceptance: specs en verde + coverage de esos archivos.
- [x] **T2 — Componentes Vue (Capa 2, §5).** Route: delegated direct. Contrato público (props/render, interacción, validación, emits, carga/vacío/error) de `SearchBar.vue`, `Modal.vue`/`ConfirmDialog.vue`, `AttachmentUpload.vue` con `mount`. Acceptance: specs en verde sin acoplarse a internos.
- [x] **T3 — Stores Pinia (Capa 3, §6).** Route: delegated direct. Pinia fresca por test, acciones reales: `search` (éxito/vacío/error/limpieza), `tasks` (getters y transiciones incl. optimistas con rollback), `auth` (login/logout/error). Mockear `src/api/client.ts`, no axios. Acceptance: specs en verde, sin contaminación entre casos.
- [x] **T4 — Integración con MSW (Capa 4, §7).** Route: delegated direct. Servidor MSW en `tests/setup.ts` + `tests/mocks/{handlers,server}.ts`; flujos componente+store+router (búsqueda: éxito/vacío/401/500; navegación con guard). Restablece handlers/mocks por test. Acceptance: set pequeño en verde, simulando solo el borde HTTP.
- [x] **T5 — E2E Playwright (Capa 5, §8).** Route: delegated direct. 2–3 flujos críticos de solo lectura o datos aislados (app carga, login visible, ruta protegida redirige sin token); selectores por rol/etiqueta; sin `waitForTimeout`; escenarios neutrales en `tests/e2e/scenarios/*.md`. Acceptance: `test:e2e` en verde en Chromium local.
- [x] **T6 — Cierre ( §§9–10).** Route: delegated direct (docs + CI). `test:coverage` con línea base, `type-check` + `build` verdes, workflow CI (job unitario + job Playwright separado con navegadores), README/comandos documentados, carpeta reservada `tests/e2e/testerarmy/` (vacía, solo reserva). Acceptance: todo verde y criterio de finalización inicial cumplido.

## Authorized scope (writer)

Cada delegación recibe su `## Allowed edit surfaces` exacta; por defecto nada fuera de: `vite.config.ts`, `package.json`, `playwright.config.ts`, `tests/**`, y para T6 `.github/workflows/**` + `README.md`/`docs/**`. Prohibido: `src/**` (salvo lectura), `.env`, secretos, producción.

## Progress

- 2026-10-08: rama creada; baseline type-check + build OK; doc creado (8/8 pendientes).
- T0 done (`815ab10`): infra completa; `test:unit:run` 1/1 verde; type-check y build verdes. Desvíos: `msw@^2` pineado (msw 3 exige Vite ≥ 6); `playwright install chromium` blocked — Playwright 1.64 no soporta la plataforma (hay Chrome del sistema en `/usr/bin/google-chrome`; T5 usará `channel: 'chrome'` o executablePath). T1: pending. T2: pending. T3: pending. T4: pending. T5: pending. T6: pending.
- T1 done (`a19a3c5`): 64 passed + 1 skipped. HALLAZGO (no corregido, fuera de scope): `src/lib/attachmentUtils.ts:61` `getFileExtension('README')` devuelve `'E'` en vez de `''` (`slice(-1)` cuando no hay punto); corrompe `truncateFileName` con nombres largos sin extensión. Test documentado como `it.skip`. Proponer fix al usuario, no aplicar en silencio.
- T2 done (`d3035c7`): SearchBar 7, Modal 9, ConfirmDialog 9, AttachmentUpload 14 → total 106 passed + 1 skipped (skip preexistente T1). Sin hallazgos en src. Notas: VTU no atraviesa Teleport (verificar en document.body); nextTick tras mount; PagedEditor/Tiptap excluido a propósito.
- T3 done (`bd525ff`): search 10, tasks 23+1 skip, auth 17 → total 156 passed + 2 skipped. HALLAZGO 2 (no corregido): `src/stores/tasks.ts:147-148` `deleteTask` lee `apiError.detail` sin optional chaining; error de red sin `response` lanza TypeError en el catch y deja `error` sin asignar (caso `it.skip`). Notas: auth lee localStorage al crearse (sembrar antes de Pinia fresca); mockear `@/api/client` con importOriginal para `instanceof ApiValidationError`; auth exige stub de `useRouter`.
- T4 done (`de40b61`): handlers MSW base + overrides (éxito/vacío/401/500); search-flow 5 (vista real + cadena SearchBar→router→store→MSW→render); router-guard 3 → total 164 passed + 2 skipped. Sin hallazgos nuevos. Conducta observada: 401 sin refreshToken → interceptor emite UnauthorizedError sin response → store muestra mensaje genérico.
- T5 done (`01367a8`): smoke 2 + auth 2 → 4/4 verde con Chrome del sistema (`PLAYWRIGHT_CHROME=1`, channel chrome; CI sigue con Chromium empaquetado). Escenarios neutrales login/search-projects/manage-tasks. Nota: home tiene dos links "Iniciar Sesión" (navbar+hero) → `.first()` por modo estricto.
- T6 done (commit pendiente): cobertura base global 20.32% líneas (lib 95.48%, stores 32.11% con auth/search 100%, views 4.78% con SearchResults 96%); workflow CI con jobs unit+e2e separados (Node 22, sin secretos); triggers ampliados a [main, develop] por el padre; sección Tests en README; `tests/e2e/testerarmy/` reservada. Sin umbrales (prohibido día 1).

## Verification evidence

- Baseline: `npm run type-check` → pass; `npm run build` → `✓ built in 19.03s`. (Por tarea: `<comando>: <resultado observado>` del writer + spot check del padre.)
- Commits por tarea: (pendiente — se registran aquí como evidencia).

## Next step

Delegar T0 a un writer acotado y commitear como unidad de trabajo.
