# Feature: translate-commits-es — Traducir commits sobre be34c32 a español

## Objective
Traducir a español los mensajes de commits en inglés por encima de `be34c32` (último commit en español), manteniendo prefijos conventional-commits y sin tocar PRs (títulos y descripciones ya en español, PR #18 intacta).

## Problem
Desde `815ab10` en adelante varios `feat/fix/test/docs/chore` quedaron en inglés, cuando el repo venía con commits y PRs en español.

## Why
Pedido explícito del usuario 2026-10-11 + autorización para reescribir historial público con force-push.

## Scope
- Solo mensajes de commits no-merge en rango `be34c32..HEAD` (21 commits).
- No tocar merges `Merge pull request #...` ni `Merge branch ...` (histórico en inglés, generados por GitHub/git).
- No tocar títulos ni descripciones de PRs #18-#25 vía `gh` (ya en español).
- Ramas afectadas: `main`, `develop`, más `feat/*` con origen que apuntan al rango.

## Constraints
- Reescritura destructiva de historial público: backup previo obligatorio, `push --force-with-lease` solo tras verificación.
- Preservar prefijos `test:/feat:/fix:/docs:/chore:` y referencias técnicas (rutas, comandos, `PUT /proyectos/{id}`).
- Los cuerpos con hashes viejos (`d4e527b`, `54dec71`) quedan como referencia histórica; el rewrite los invalida como punteros.
- Un solo escritor; sin writers paralelos en el mismo worktree.

## Checklist
- [x] T1 Inventariar `be34c32..HEAD` (33 commits) y verificar PRs #18-#25 en español con `gh`
- [x] T2 Crear backup `backup-main-pre-traduccion` + `backup-develop-pre-traduccion`
- [x] T3 Reescribir mensajes (21) con `rebase -i --rebase-merges` + reword automático (base `be34c32` preservada)
- [x] T4 Verificar `git log` en español + `gh pr view` intactos, luego `push --force-with-lease` autorizado (main + develop; feats sin contraparte remota)

## Authorized scope
- Rango `be34c32..HEAD` en este worktree `production`; `git filter-branch`, `git branch backup-*`, `git push --force-with-lease`.
- Sin cambios de código fuente; solo mensajes.

## Acceptance criteria
- `git log --format=%s be34c32..HEAD` sin inglés en commits no-merge (salvo términos propios: Vitest, MSW, Playwright, Pinia, Trello, DOCX, CI).
- `gh pr view 18..25 --json title` sin cambios.
- `git status` limpio salvo `?? .atl/` preexistente + este doc.

## Verification
- `git log --oneline --decorate be34c32..HEAD`
- `for n in 18 19 20 21 22 23 24 25; do gh pr view $n --json title; done`
- `git push --force-with-lease` solo tras T3 verde.

## Route
- Delegated direct no aplica (operación git local acotada, sin exploración amplia ni multi-archivo).
- Ruta: direct inline + bash para estado; rewrite como acción acotada única.

## Traducciones (SHA corto -> nuevo subject)
- `815ab10` test: agregar infraestructura de pruebas con Vitest, MSW y Playwright (T0)
- `a19a3c5` test: agregar suites unitarias para utilidades de fecha, adjuntos y css (T1)
- `d3035c7` test: agregar suites de componentes para SearchBar, Modal, ConfirmDialog y AttachmentUpload (T2)
- `bd525ff` test: agregar suites de stores Pinia para búsqueda, tareas y auth (T3)
- `de40b61` test: agregar suites de integración con MSW para flujo de búsqueda y guards del router (T4)
- `01367a8` test: agregar suites E2E con Playwright para smoke/auth y escenarios neutros (T5)
- `4f75bfb` test: agregar base de cobertura, workflow de CI y docs de pruebas (T6)
- `c8cea02` docs: registrar evidencia T6 y cerrar iteración de estrategia de pruebas
- `cf69c3d` fix: compartir alias de rutas de Vite con config TypeScript y tipar pruebas
- `e9a4def` fix: manejar archivos sin extensión y errores de red sin respuesta
- `cf57736` docs: registrar bugfixes hallados por pruebas y agregar TODO de validación de carga
- `d853314` feat(upload): restringir validación de carga a docx
- `4bda053` feat(upload): UI de carga solo-docx y protección del editor
- `b39c86b` feat(projects): agregar acciones de archivado al store y tipo deleted_at
- `6573a21` feat(projects): agregar vista de archivados y flujo de archivado en dashboard
- `321fc3a` chore(repo): eliminar TODO.md obsoleto e ignorarlo
- `76f288b` docs(tasks): marcar F1-F4 como hechas con hashes
- `beee654` fix(ui): apilar acciones de archivados en vertical en pantallas pequeñas
- `d4e527b` test(project-rename): agregar specs en fallo para renombrado inline estilo Trello (+cuerpo ES)
- `54dec71` feat(project-board): agregar renombrado inline de proyectos estilo Trello (+cuerpo ES)
- `e0b180e` docs(project-rename): registrar evidencia GREEN de verificación (+cuerpo ES)

## Progress
- T1 hecho: 33 commits en rango, 21 a traducir, PRs #18-#25 ya en español.
- T2 hecho: backups en `c00caaf`.
- T3 hecho: rebase `--rebase-merges` sobre `be34c32` (preservada como ancestro); 21 rewords ES; merges intactos; `git diff backup-main HEAD --stat` vacío (solo mensajes).
- T4 hecho: `origin/main` y `origin/develop` en `fde2973` vía `--force-with-lease`. Feats locales actualizados a la nueva historia (`e23355e`, `9c80847`, `7b45f2e`, `50d3b5f`); sin `refs/heads/feat/*` en remoto, no se recrearon. PRs #18-#25 sin cambios.
- Next: ninguna; `git fetch --prune` corrido 2026-10-11 (limpió `origin/feat/*` obsoletos). Solo falta borrar backups cuando confirmes.

## Evidence
- Base: `be34c32a7ede57a1af321f97d64da861b96eaa8c Quitar comentario duplicado`
- Pre-rewrite HEAD: `c00caaf7be5146c569283d71c684488a4d0f08ca`
