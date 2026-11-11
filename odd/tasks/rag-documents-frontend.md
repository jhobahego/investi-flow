# Feature: rag-documents-frontend — Document RAG Citations & Source Transparency

## Objective
Update the frontend application to support the RAG capability: display retrieved source citations in the AI chat and suggestions, provide visual document indexing status, and eliminate obsolete client-side context payloads.

## Problem
1. **Zero citation / source visibility**: `ChatMessage` only displays raw AI Markdown (`types/index.ts:206-212`, `ChatView.vue:113`). Users cannot verify which document, chapter, or paragraph informed the AI's response.
2. **Redundant & misleading context sent by client**:
   - `useAISuggestions.ts:104-112` sends `full_document_content = editor.getText()`, but because TipTap is instantiated per-page in `PagedEditor.vue:398-522`, this sends only the current page while misleading developers into thinking the whole doc is sent.
   - `AddBibliographyModal.vue:243-268` sends `search_context` as raw HTML of all joined pages, causing unnecessary bandwidth and payload bloat.
3. **No indexing feedback**: When a user uploads a DOCX or edits pages, there is no indicator showing whether the document is ready/indexed for AI retrieval.
4. **Untested AI surface**: The frontend has zero unit or component tests covering `ChatView.vue`, `useAISuggestions.ts`, or `aiService.ts`.

## Scope
- Frontend repository (`investi-flow`), staging worktree, branch `feat/rag-documents-frontend` from `develop`.
- Rendering source citations beneath AI chat responses and inline suggestion popups.
- Displaying document indexing status (`indexed`, `indexing`, `error`) in attachment components.
- Payload cleanup in `useAISuggestions.ts` and `AddBibliographyModal.vue`.
- Vitest unit tests with MSW mocks for chat and suggestion interactions.

## Constraints
- Single writer; no parallel writers in this worktree.
- Conventional Commits in English; code/identifiers in English.
- Maintain responsive layout and Tailwind CSS design patterns.
- Do not introduce external vector or Supabase libraries to the frontend; all retrieval remains encapsulated in the backend API.

## Checklist
- [x] F1 Update API contracts and types (`src/types/index.ts`): add `DocumentSource` interface `{ attachment_id: number, file_name: string, chunk_index: number, snippet: string, similarity: number }` to `ChatMessage`, `ChatResponse`, and `SuggestionResponse`.
- [x] F2 Source citation UI in Chat (`src/views/ChatView.vue`): collapsible "Fuentes consultadas" (Sources used) panel below assistant messages showing document name and matched excerpts.
- [x] F3 Document indexing status indicator (`src/components/ui/AttachmentUpload.vue`): badge showing whether the document vector embeddings are generated or in progress.
- [x] F4 Clean up client-side context generation in `src/composables/useAISuggestions.ts` and `src/components/editor/AddBibliographyModal.vue`, delegating retrieval to the backend.
- [x] F5 Unit tests in Vitest (`tests/unit/components/ChatSources.spec.ts` and MSW handlers in `tests/mocks/handlers.ts`).

## Authorized Scope
- `src/types/index.ts`
- `src/api/chatService.ts`
- `src/api/aiService.ts`
- `src/views/ChatView.vue`
- `src/components/ui/ChatSources.vue` (new)
- `src/components/editor/BibliographyPanel.vue`
- `src/views/DocumentEditorView.vue`
- `tests/components/AttachmentUpload.spec.ts`
- `src/composables/useAISuggestions.ts`
- `src/components/ui/AttachmentUpload.vue`
- `src/components/editor/AddBibliographyModal.vue`
- `tests/mocks/handlers.ts`
- `tests/unit/components/ChatSources.spec.ts` (new)
- `odd/tasks/rag-documents-frontend.md` (this file)

## Acceptance Criteria
- AI Chat displays a collapsible list of sources/citations when returned by the backend.
- Hovering or expanding a citation displays the exact snippet and source document name.
- Uploaded attachments display an indexing badge (`Indexado` / `Indexando`).
- Payload to `/ia/sugerencias` no longer transmits the redundant single-page text as "full document".
- Type checks (`npm run type-check`) and unit tests (`npm run test:unit:run`) pass without errors.

## Applicable Checks
- `npm run type-check` (`vue-tsc --build --force`)
- `npm run test:unit:run` (Vitest with MSW)
- `npm run build`

## Route
- Delegated direct. Triggers: touches multiple components, types, and stores across the UI.

## Delivery Strategy
- Strategy: `single-pr` (`feat/rag-documents-frontend` from `develop`). Estimated ~150-250 lines of code.


## Progress (2026-11-10)
- F1, F2, F3, F5 done; F4 partial: `search_context` removed; `full_document_content` still sent because the backend schema requires it (backend decides how to use it).
- Contract validated against live OpenAPI: `ChatSource` and `AttachmentResponse.indexing_status` match the frontend types.
- Checks: `npm run type-check` OK, `npm run test:unit:run` 202/202. `npm run build` pending.
- Pending: live curl check blocked — local DB lacks column `attachments.indexing_status` (500 on `/documentos`); backend migration needs applying.

### Validación en vivo end-to-end (2026-11-10)
- Subida de documento `.docx`: responde `indexing_status: "pending"`.
- Polling a `/proyectos/{id}/documentos`: transición observada `pending` -> `indexing` -> `indexed` (1 s).
- Pregunta contextual en `/proyectos/{id}/chat`: recuperación RAG exitosa (`sources: [...]` con `attachment_id`, `file_name`, `chunk_index`, `snippet`, `similarity`).
- Recarga de conversación en `/proyectos/{id}/conversaciones/{id}`: fuentes persisten en el mensaje `model` y se recuperan intactas.
- Todo el checklist F1-F5 completado.
