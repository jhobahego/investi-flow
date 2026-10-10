# Feature: project-rename-inline — Trello-style rename from detail view

## Objective
Enable inline project rename from the project detail view, Trello-style: click title to edit, Enter/blur saves, Esc cancels.

## Problem
Project name is set at creation but cannot be updated from UI. Backend already supports `PUT /proyectos/{id}` with `ProjectUpdate.name`; frontend `src/stores/projects.ts:updateProject` exists but has zero callers. Detail title `src/views/ProjectBoard.vue:47` is read-only.

## Why
Explicit user request 2026-10-10. Completes TODO.md §2 frontend.

## Scope
- Only frontend repo (`investi-flow`), new branch from `main` (which already has archiving PR #23).
- Only TODO.md §2 frontend inline rename. Backend out of scope (already done).
- No push/PR/merge (user decision).

## Constraints
- Single writer; no parallel writers in same worktree.
- Conventional Commits in English; code/identifiers in English.
- Reuse existing `updateProject(id, {name})` (`PUT /proyectos/${id}`); no new API contract.
- Pre-validate: trim, reject empty/whitespace (backend strips/rejects too), max 255.
- Trello UX: click `h1` → input autofocus+select, Enter/blur=save, Esc=cancel, loading state, toast success/error, keep cache consistent (`currentProject` + list + invalidate).
- Do not break archived listings (`deleted_at`).

## Checklist
- [x] R1 Branch `feat/project-rename-inline` from `main` + RED tests (store PUT + component inline behavior)
- [x] R2 Inline edit UI in `ProjectBoard.vue` (toggle, save/cancel, validation, toast)
- [ ] R3 GREEN verification (type-check, unit, build) + TODO/docs update

## Authorized scope
- `src/views/ProjectBoard.vue`
- `src/stores/projects.ts` (reuse only, thin wrapper if needed)
- `src/types/index.ts` (no change expected)
- `tests/unit/stores/project-rename.spec.ts` (new)
- `tests/components/ProjectBoardRename.spec.ts` (new)
- `tests/mocks/handlers.ts` (PUT mock only)
- `odd/tasks/project-rename-inline.md` (this file)

## Acceptance criteria
- Click on project title in `/project/:id` turns it into an editable input (Trello-style).
- Enter or blur with valid non-empty name calls `PUT /proyectos/{id}`, updates `currentProject.name` + list immediately, shows success toast.
- Esc or blur with empty/unchanged value cancels without API call.
- Empty/whitespace-only name is rejected client-side with error toast, no request sent.
- Failed request shows error toast and restores previous name.

## Applicable checks
- `npm run test:unit:run` (Vitest, MSW strict — needs PUT mock)
- `npm run type-check` (`vue-tsc --build --force`)
- `npm run build`
- TDD: RED before GREEN (new rename tests failing before UI change), then GREEN.

## Route
- Delegated direct. Trigger evidence: mapping needed store+view+router+tests (>5 lookups); implementation touches 2+ non-trivial files (view + 2 spec files). Explorer handoff already compressed (~2k tokens).

## Delivery strategy
- Forecast <100 authored lines. Strategy: `single-pr`. No chain needed.

## Progress
- 2026-10-10: explorer mapped detail/store/contract (ProjectBoard.vue:47, store updateProject:209-213, zero callers). Parent spot-checked ProjectBoard.vue:41-51.
- 2026-10-10 R1: branched `feat/project-rename-inline` from `origin/main`; added PUT mocks (`renameProjectHandler`, `renameProjectErrorHandler`) in `tests/mocks/handlers.ts`, `tests/unit/stores/project-rename.spec.ts` (5 tests), `tests/components/ProjectBoardRename.spec.ts` (6 tests). Commit `d4e527b`.
- 2026-10-10 R2: Trello-style toggle in `ProjectBoard.vue` (h1 with hint → autofocus+select input; Enter/blur save with trim, unchanged/empty guards, 255 cap; Esc cancel+restore; toasts; `invalidateProjectCache` on success) + thin trim wrapper in `updateProject` (`src/stores/projects.ts`). No `deleted_at` touch — archived listings unaffected.

## Verification evidence
- R1 RED: `npx vitest run tests/unit/stores/project-rename.spec.ts tests/components/ProjectBoardRename.spec.ts` → 2 files failed, 7 failed / 4 passed (all 6 component tests fail — no inline UI yet; store trim test fails — store sends raw name; 4 store PUT/sync tests pass on existing behavior).
- R2 GREEN (focused): same command → 2 files passed, 11 passed / 11.

## Verification evidence
- R1 RED: `npx vitest run tests/unit/stores/project-rename.spec.ts tests/components/ProjectBoardRename.spec.ts` → 2 files failed, 7 failed / 4 passed (all 6 component tests fail — no inline UI yet; store trim test fails — store sends raw name; 4 store PUT/sync tests pass on existing behavior).

## Next step
- Create branch from `main`, implement R1-R3 via one bounded writer.
