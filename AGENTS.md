# AGENTS.md — InvestiFlow Frontend

Operational guide, architecture reference, and execution contract for AI agents working in this repository.

## Quick Reference

| Command | Purpose | When to run |
| --- | --- | --- |
| `npm run dev` | Starts Vite local development server (`http://127.0.0.1:5173`) | Manual UI debugging |
| `npm run type-check` | Runs `vue-tsc --build --force` | Before any commit / task completion |
| `npm run test:unit:run` | Single-run Vitest test suite (unit, components, stores, integration) | Mandatory verification gate |
| `npm run test:unit` | Vitest in watch mode | Active TDD / iterative development |
| `npm run test:coverage` | Vitest with v8 coverage report | Verifying test coverage thresholds |
| `npm run test:e2e` | Headless Playwright tests (`tests/e2e/playwright/`) | End-to-end user flow verification |
| `npm run test:e2e:ui` | Interactive Playwright UI mode | Debugging broken E2E flows |
| `npm run build` | Full production build (`vue-tsc -b && vite build`) | Final delivery check |

---

## Project Overview & Architecture

InvestiFlow is a scientific research management web platform featuring interactive Kanban boards, document attachment flows, and **Lexi** (an AI assistant powered by Google Gemini).

- **Framework**: Vue 3 (`3.4.x`) using Composition API with `<script setup lang="ts">`.
- **Language**: TypeScript (`5.5.x`) with strict compiler checks.
- **State Management**: Pinia (`2.1.x`) setup stores.
- **Styling**: Tailwind CSS (`3.4.x`) + HeroIcons (`@heroicons/vue`).
- **Rich Text Editor**: TipTap (`@tiptap/vue-3`) with custom extensions and `vue-dompurify-html`.
- **Build Tool**: Vite (`5.4.x`).
- **Testing**: Vitest (`3.2.x`), `@vue/test-utils`, MSW (Mock Service Worker `2.15.x`), and Playwright (`1.64.x`).

### Directory Layout

```
src/
├── api/          # HTTP service clients (Axios wrappers, backend endpoints)
├── assets/       # Static assets, fonts, icons
├── components/   # Vue components
│   ├── editor/   # TipTap rich-text editor components and toolbars
│   ├── layout/   # Navbar, Sidebar, Page shells
│   └── ui/       # Primitives, buttons, modals, dropdowns
├── composables/  # Reusable Composition API logic (use<Feature>.ts)
├── config/       # Environment configs and constants
├── data/         # Mock data and static fixtures
├── lib/          # Utilities (utils.ts with `cn()`, attachmentUtils, dateUtils)
├── router/       # Vue Router routes and navigation guards
├── stores/       # Pinia stores (auth, projects, tasks, attachments)
├── types/        # TypeScript interfaces, enums, and API models (index.ts)
└── views/        # Page-level route views (ProjectBoard, Login, Dashboard, etc.)

tests/
├── components/   # Vue component mount & interaction tests (@vue/test-utils)
├── e2e/          # Playwright test specs and page object models
├── integration/  # API workflow tests integrated with MSW
├── mocks/        # MSW handlers (`handlers.ts`), server setup (`server.ts`)
├── setup.ts      # Vitest bootstrap and global MSW lifecycle hooks
└── unit/         # Pure logic, utils, and Pinia store tests (`stores/`)
```

---

## Coding Standards & Conventions

### 1. Vue 3 & Component Architecture

- **SFC Structure**: Always enforce this block order:
  ```vue
  <script setup lang="ts">
  // imports -> props/emits -> state -> computed -> methods -> lifecycle
  </script>

  <template>
    <!-- Declarative template -->
  </template>

  <style scoped>
    /* Scoped styles only if Tailwind is insufficient */
  </style>
  ```
- **Composition API only**: Never use the Options API (`data()`, `methods:`, `computed:` object options).
- **Container-Presentational Pattern**:
  - `src/views/` handle route params, trigger store actions, and compose layout.
  - `src/components/` receive props and emit events (`defineProps`, `defineEmits`). Avoid direct global state mutations inside generic UI components.
- **Reactivity Best Practices**:
  - Keep source state minimal (`ref`, `reactive`).
  - Derive state using `computed()`; avoid syncing state manually with `watch` unless handling external side effects.
  - Always clean up event listeners, timers, or observer subscriptions in `onUnmounted()`.

### 2. TypeScript & Types

- **Strict Typing**: All code must pass `npm run type-check`. No implicit `any`, no untyped catches.
- **Type Definitions**: Domain models and API responses belong in `src/types/index.ts`.
- **Path Aliases**: Always use `@/*` to reference `src/*` (e.g., `import { useAuthStore } from '@/stores/auth'`).

### 3. Styling & UI

- Use **Tailwind CSS** utility classes directly in templates.
- For conditional class concatenation, use `cn()` from `@/lib/utils` (built on `clsx` + `tailwind-merge`):
  ```ts
  import { cn } from '@/lib/utils'
  const buttonClass = cn('base-btn', isActive && 'active-btn', customClass)
  ```
- All user-facing UI labels, error messages, and tooltips are in **Spanish** (e.g., `"Guardar cambios"`, `"Error al cargar el proyecto"`).

### 4. Security & Sanitization

- When rendering HTML strings produced by the TipTap editor or API payloads, **always** sanitize using `v-dompurify-html`:
  ```vue
  <div v-dompurify-html="richContent" class="prose max-w-none" />
  ```
- Never use raw `v-html` on unvetted or user-generated input.

---

## Testing & MSW Protocols

### MSW Strict Mode (Crucial Gotcha)

In `tests/setup.ts`, the Mock Service Worker is configured with:
```ts
server.listen({ onUnhandledRequest: 'error' })
```
- **Impact**: Any network request (`axios`, `fetch`) dispatched during tests that does not match an existing mock in `tests/mocks/handlers.ts` will **throw an error and fail the test**.
- **Action**: When adding new API calls or endpoints:
  1. Add default handler mocks in `tests/mocks/handlers.ts`.
  2. For test-specific responses (errors, edge cases), use `server.use(...)` inside the specific test file.

### Test-First Workflow (TDD)

When fixing bugs or implementing features:
1. **RED**: Write a failing test in the appropriate test layer (`tests/unit/`, `tests/components/`, or `tests/integration/`). Observe the test fail.
2. **GREEN**: Implement the minimal code required to satisfy the test.
3. **REFACTOR**: Clean up, check types (`npm run type-check`), and verify all tests pass (`npm run test:unit:run`).

---

## Git & Commit Conventions

### Branch Strategy
- `develop`: Main development and integration branch.
- `main`: Production release branch.
- Feature branches: `feat/<feature-name>`, `fix/<bug-name>`.

### Commit Message Format
This repository uses **Conventional Commits in Spanish**:
- Format: `<tipo>(<alcance>): <descripción concisa>`
- Types: `feat`, `fix`, `test`, `docs`, `refactor`, `style`, `chore`
- Examples:
  - `feat(project-board): agregar renombrado inline de proyectos estilo Trello`
  - `fix(auth): corregir refresco de token expirado en axios interceptor`
  - `test(kanban): agregar cobertura para reordenamiento de tareas`
  - `docs(readme): actualizar instrucciones de instalación y entorno`

### Prohibited in Commits
- **Never** add `Co-Authored-By` or AI attribution markers.
- Commit messages must be strictly clean and human-authored in Spanish.

---

## Agent Operational Rules

1. **Verify Before Declaring Done**:
   Before handing work back to the user, the agent MUST run and verify:
   ```bash
   npm run type-check
   npm run test:unit:run
   ```
2. **Preserve Workspace State**:
   Never discard, stage, or commit unrelated modified or untracked files without explicit user consent.
3. **No Automatic Commits or Pushes**:
   Never execute `git commit`, `git push`, or open pull requests unless explicitly instructed by the user.
