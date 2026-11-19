# Feature: rag-live-indexing-status — Live Indexing Status Polling & PDF Upload

## Objective
Wire live document indexing status polling (`pending` -> `indexing` -> `indexed` | `error`) into the staging frontend and enable `.pdf` document uploads alongside `.docx`, while keeping the TipTap editor strictly `.docx`-only.

## Problem & Why
1. `AttachmentUpload.vue` renders `props.currentAttachment.indexing_status`, but after upload `src/stores/attachments.ts` caches the `pending` response and nothing refreshes or polls it, leaving the badge stuck on "Pendiente" until a full page reload.
2. `handleTaskDocumentUploaded`, `handleTaskDocumentUpdated` in `ProjectBoard.vue`, and `handlePhaseAttachmentChange` in `PhaseColumn.vue` only log instead of updating the `useAttachmentsStore` cache.
3. The file picker and `validateFile` currently restrict uploads to `.docx`, whereas the backend (`investi-flow-api`) already extracts and indexes `.pdf` attachments for RAG.

## Scope
- Frontend repository (`investi-flow`), branch `develop` (working tree edits only; no automatic commits or pushes per `AGENTS.md`).
- **Required**:
  - `src/stores/attachments.ts`: `getDocument` (already exists, verify/keep cache behavior), `refreshDocument` (silent refresh that bypasses cache, never overwrites cache with `null` or `404`, and never flips `loading`), and `setCachedDocument`.
  - `src/composables/useIndexingStatusPolling.ts`: 2 s polling while `pending` or `indexing`, stop on `indexed` or `error`, 60 s hard cap, no overlapping requests, stop on unmount/dispose, clean restart when `attachment.id` / entity changes without resetting the 60 s cap on `pending` -> `indexing` transitions of the same attachment.
  - Propagate updates via `attachment-updated` in `AttachmentUpload.vue`, `ProjectBoard.vue`, and `PhaseColumn.vue`.
  - Unit and component tests with Vitest fake timers and MSW.
- **Optional (User-confirmed)**:
  - Accept `.docx` and `.pdf` in `src/lib/attachmentUtils.ts` and `AttachmentUpload.vue` file inputs/help text, while keeping `viewDocument` strictly `.docx`-only.
- **Out of scope**:
  - Reindex buttons / admin UI, ChatSources redesign, `DocumentSource` contract changes, backend changes.

## Constraints
- Vue 3 `<script setup lang="ts">` + Pinia + TypeScript; no new dependencies.
- Preserve `DocumentSource` contract and keep `viewDocument()` `.docx`-only.
- Keep polling out of template/render functions and clear all timers on unmount/dispose.
- Do not run `git commit`, `git push`, or create PRs (`AGENTS.md`).

## Checklist
- [x] T1 Store actions (`refreshDocument`, `setCachedDocument`) in `src/stores/attachments.ts` + MSW tests in `tests/unit/stores/attachments.spec.ts` (Risk: Medium — writer self-verification + parent spot check).
- [x] T2 Polling composable in `src/composables/useIndexingStatusPolling.ts` + fake-timer tests in `tests/unit/composables/useIndexingStatusPolling.spec.ts` (Risk: Medium — writer self-verification + parent spot check).
- [x] T3 Accept `.pdf` in `src/lib/attachmentUtils.ts` + updated tests in `tests/unit/attachmentUtils.spec.ts` (Risk: Low/Medium — writer self-verification).
- [x] T4 Wire polling and `.docx,.pdf` picker in `src/components/ui/AttachmentUpload.vue` + tests in `tests/components/AttachmentUpload.spec.ts` (Risk: Medium — writer self-verification).
- [x] T5 Propagate attachment updates in `src/views/ProjectBoard.vue` & `src/components/ui/PhaseColumn.vue` + tests in `tests/components/ProjectBoardAttachments.spec.ts` (Risk: Medium — writer self-verification).
- [x] T6 Run full verification (`npm run type-check`, `npm run test:unit:run`, `npm run build`) and finalize ODD tracking.

## Authorized Scope
- `src/stores/attachments.ts`
- `src/composables/useIndexingStatusPolling.ts` (new)
- `src/lib/attachmentUtils.ts`
- `src/components/ui/AttachmentUpload.vue`
- `src/views/ProjectBoard.vue`
- `src/components/ui/PhaseColumn.vue`
- `tests/unit/stores/attachments.spec.ts` (new)
- `tests/unit/composables/useIndexingStatusPolling.spec.ts` (new)
- `tests/unit/attachmentUtils.spec.ts`
- `tests/components/AttachmentUpload.spec.ts`
- `tests/components/ProjectBoardAttachments.spec.ts` (new)
- `tests/components/ProjectBoardRename.spec.ts` (only if mock needs `setCachedDocument`)
- `odd/tasks/rag-live-indexing-status.md` (this file)

## Acceptance Criteria
- Uploading a `.docx` or `.pdf` initiates polling every 2 s while `pending` or `indexing`, updates the badge `Pendiente -> Indexando -> Indexado` via `attachment-updated`, and stops at `indexed` or `error`.
- Polling stops cleanly after 60 s hard cap when status stays `pending` or `indexing`.
- Unmount/dispose clears timers; no overlapping requests occur; attachment ID changes restart polling with a fresh 60 s budget; `null` or `404` GET responses never overwrite existing cache.
- `npm run type-check`, `npm run test:unit:run`, and `npm run build` pass cleanly.

## Applicable Checks
- `npm run type-check`
- `npm run test:unit:run`
- `npm run build`

## Route & Delivery Strategy
- Route: Direct incremental TDD execution following the approved plan (`T1` -> `T6`).
- Delivery Strategy: `single-pr` / working tree only (commits and pushes withheld per `AGENTS.md`). Estimated authored lines: ~380–550 lines including comprehensive unit & component tests.

## Progress & Verification Evidence
- Baseline before edits: `npm run type-check` PASS; `npm run test:unit:run` 19 files, 202/202 tests PASS.
- T1 (`src/stores/attachments.ts`, `tests/unit/stores/attachments.spec.ts`): RED 8 failed / 4 passed -> GREEN 1 file, 12/12 tests PASS.
- T2 (`src/composables/useIndexingStatusPolling.ts`, `tests/unit/composables/useIndexingStatusPolling.spec.ts`): RED import failure -> GREEN 1 file, 12/12 tests PASS.
- T3 (`src/lib/attachmentUtils.ts`, `tests/unit/attachmentUtils.spec.ts`): RED 3 failed / 31 passed -> GREEN 1 file, 34/34 tests PASS.
- T4 (`src/components/ui/AttachmentUpload.vue`, `tests/components/AttachmentUpload.spec.ts`): RED 7 failed / 22 passed -> GREEN 1 file, 29/29 tests PASS.
- T5 (`src/views/ProjectBoard.vue`, `src/components/ui/PhaseColumn.vue`, `tests/components/ProjectBoardAttachments.spec.ts`): RED 3 failed -> GREEN 2 files (`ProjectBoardAttachments.spec.ts` + `ProjectBoardRename.spec.ts`), 9/9 tests PASS; refactored `syncProjectDocument` / `syncTaskDocument` helpers.
- T6 Final verification after last edit:
  - `npm run type-check` (`vue-tsc --build --force`): PASS (exit 0).
  - `npm run test:unit:run` (`vitest run --reporter=dot`): PASS (22 test files, 235/235 tests passed).
  - `npm run build` (`vue-tsc -b && vite build`): PASS (exit 0, built in 10.43s).
- Working tree kept uncommitted and unpushed per `AGENTS.md`.

## Next Step
- Ready for manual E2E/browser verification against the running API and user-initiated commit/PR when ready.
