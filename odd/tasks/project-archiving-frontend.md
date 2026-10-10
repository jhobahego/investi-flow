# Feature: project-archiving — frontend (archivado + limpieza TODO)

## Objective
Implementar la mitad frontend del archivado (`TODO.md` §1 del proyecto padre) y eliminar `TODO.md` (validación docx, ya implementada) añadiéndolo al `.gitignore`.

## Problem
Verificado en este staging: `src/views/DashboardPage.vue:258-275` + `src/stores/projects.ts:248-269` hacen hard-delete vía `DELETE /proyectos/:id`; no hay vista, ruta ni tipos de archivado (`src/types/index.ts:94-125` sin `deleted_at`); `src/router/index.ts:22-32` sin ruta de archivados.

## Why
Pedido explícito del usuario 2026-10-10. Restricción vigente: trabajar siempre desde los staging (este worktree, rama `develop`).

## Scope
- Solo este repo (`investi-flow`), worktree staging, rama feature desde `develop`.
- Solo `TODO.md` §1 (archivado). §2 (renombrar) FUERA de alcance.
- Incluye: `git rm TODO.md` + entrada `TODO.md` en `.gitignore`.
- No incluye: cambios en `main`/prod, push/PR/merge (decisión del usuario), backend (vive en doc hermano).

## Sibling doc (contrato)
- Backend (DUEÑO del contrato API): `/home/jhobadev/Escritorio/Dev/investi-flow-project/investi-flow-api.worktrees/staging/odd/tasks/project-archiving-backend.md`
- Índice padre (puntero, no fuente): `/home/jhobadev/Escritorio/Dev/investi-flow-project/odd/tasks/project-archiving.md`
- Si el backend cambia el contrato, este doc se actualiza con razón y se re-verifica; este doc NO redefine endpoints.

## API contract (copia congelada 2026-10-10, fuente: doc backend)
- `DELETE /proyectos/{id}` → archiva (idempotente si ya archivado). Toast: "Proyecto archivado".
- `GET /proyectos/` y `search` → sin archivados. `GET /proyectos/archived` → solo archivados.
- `POST /proyectos/{id}/restore` → restaura. `DELETE /proyectos/{id}/permanent` → borrado definitivo (solo archivado).
- Tipos: `deleted_at?: string | null` en `ProjectResponse` y listas.

## Constraints
- Un solo writer; sin writers paralelos en este worktree.
- UI copy en español (mismo estilo: "Proyecto archivado", "Proyectos Archivados", "Restaurar", "Eliminar Definitivamente"); identificadores/comentarios en inglés como el repo.
- Reutilizar `ProjectCard` + `ConfirmDialog` + `vue-toastification`; botones de archivados siempre visibles (el delete actual es hover-only, malo en móvil).
- Ramas feature desde `develop`; no tocar `main`/producción ni el checkout raíz.

## Checklist
- [x] F1 Store/tipos: `fetchArchived`, `archive` (ex-`delete`), `restore`, `hardDelete` + `deleted_at` en tipos (`b39c86b`)
- [x] F2 Dashboard: acción eliminar → archivar con toast + ruta/vista "Proyectos Archivados" con Restaurar/Eliminar definitivo + nav (`6573a21`)
- [x] F3 Tests: store spec + component spec (msw) en verde (`b39c86b`, `6573a21`)
- [x] F4 `git rm TODO.md` + `TODO.md` en `.gitignore` + verificación de ignorado (`321fc3a`)

## Authorized scope
- `src/stores/projects.ts`
- `src/types/index.ts`
- `src/views/DashboardPage.vue`
- `src/views/ArchivedProjectsView.vue` (nueva) o tab equivalente
- `src/components/ui/ProjectCard.vue` (modo archived)
- `src/router/index.ts`
- `tests/unit/stores/projects*.spec.ts` (nuevo o existente)
- `tests/components/*Archived*.spec.ts` / `Dashboard*.spec.ts` (nuevo)
- `TODO.md` (eliminar vía `git rm`)
- `.gitignore` (añadir `TODO.md`)
- `odd/tasks/project-archiving-frontend.md` (este archivo)

## Acceptance criteria
- Eliminar avisa "Proyecto archivado"; existe vista/ruta de archivados con "Restaurar" y "Eliminar Definitivamente" funcionales.
- `TODO.md` fuera del índice y en `.gitignore`; `git status` limpio respecto a él (spot check con dummy + borrado del dummy).
- `npm run test:unit:run`, `type-check` y `build` en verde; fallos/skips reportados.

## Applicable checks
- Cwd staging front: `npm run test:unit:run` (foco store+componente, luego completo); `npm run type-check`; `npm run build`.
- Parent spot check: un comando antes de entregar.

## Route declaration
- F1–F4: un solo delegated direct writer DESPUÉS del backend (el contrato depende del backend). Triggers: writer + preparation.

## Test-first policy
Aplica TDD: runner determinístico (vitest+msw) y outcomes claros. RED antes de GREEN, refactor en verde. Excepción solo documentada. No inventar evidencia.

## Delivery strategy
Forecast frontend: ~150–200 líneas autoradas. Estrategia `ask-on-risk`. Commits work-unit en rama `feat/project-archiving` desde `develop` (boundary: base de `develop`); registrar abajo. Sin push/PR/merge sin autorización.

## Progress
- 2026-10-10: creado este documento (F1 pending). Split del doc padre en dos docs versionados por repo (decisión del usuario).
- 2026-10-10: F1–F4 implementados en rama `feat/project-archiving` con TDD (RED 7 failed/1 passed en 3 specs → GREEN 13/13). Sin desvíos del contrato.

## Verification evidence
- `npm run test:unit:run`: 16 files, 184 tests passed
- `npm run type-check`: clean (vue-tsc sin errores)
- `npm run build`: success (built in ~17s)
- `git check-ignore -v TODO.md`: `.gitignore:39:TODO.md TODO.md` (match); dummy creado y borrado, sin `?? TODO.md` en status

## Commits
- `b39c86b` feat(projects): add archiving store actions and deleted_at type (F1+F3 store)
- `6573a21` feat(projects): add archived view and dashboard archive flow (F2+F3 componentes)
- `321fc3a` chore(repo): remove stale TODO.md and ignore it (F4)

## Next step
- Esperar backend (contrato final) → writer frontend F1.

## Engram mirror
- Pendiente (guardar bajo topic `odd/project-archiving/tasks`, proyecto `investi-flow`; bloqueado por `ambiguous_project` desde cwd padre — reintentar con cwd en este repo o elección del usuario).
