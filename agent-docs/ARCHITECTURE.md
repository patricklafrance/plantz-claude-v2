# Architecture

## What is plantz-claude

A plants watering application and proof-of-concept for Claude Code agent workflows. Built as a modular monolith using pnpm, Turborepo, and Squide local modules.

## Repository structure

```
plantz-claude/
  apps/
    host/                          # Squide host application (@apps/host)
    management/
      household/                   # Management domain — household module (@modules/management-household)
      plants/                      # Management domain — plants module (@modules/management-plants)
      user/                        # Management domain — user profile module (@modules/management-user)
      storybook/                   # Management domain Storybook (@apps/management-storybook)
    today/
      landing-page/                # Today domain — landing page module (@modules/today-landing-page)
      vacation-planner/            # Today domain — vacation planner module (@modules/today-vacation-planner)
      storybook/                   # Today domain Storybook (@apps/today-storybook)
    storybook/                     # Unified Storybook — all stories in the repo (@apps/storybook)
  packages/
    components/                    # Shared UI components — shadcn/ui + Tailwind v4 (@packages/components)
    core-module/                   # Cross-module infrastructure — session, auth, app shell (@packages/core-module)
    core-plants/                   # Shared plant domain types, utilities, and components (@packages/core-plants)
    storybook/                     # Packages-layer Storybook runner for shared package stories (@apps/packages-storybook)
  scripts/                         # Build scripts (getAffectedStorybooks.ts)
  agent-docs/                      # Agent documentation (this folder)
  .agents/skills/                  # Shared agent skills (git-commit, etc.)
  .claude/skills/                  # Claude Code discovery layer — symlinks to .agents/skills/ plus project-specific skills
  .github/workflows/               # CI, Chromatic, Claude, code-review
```

## Package naming conventions

| Workspace path            | Package scope | Example                      |
| ------------------------- | ------------- | ---------------------------- |
| `apps/host`               | `@apps/*`     | `@apps/host`                 |
| `apps/<domain>/storybook` | `@apps/*`     | `@apps/management-storybook` |
| `apps/<domain>/<feature>` | `@modules/*`  | `@modules/management-plants` |
| `packages/*`              | `@packages/*` | `@packages/core-plants`      |

> **Exception:** `packages/storybook` uses `@apps/packages-storybook` (historical convention — Storybook runner apps always use `@apps/*`).

## Squide host/module topology

- **Host** (`apps/host/`): Thin bootstrap layer. Creates `QueryClient`, calls `initializeFirefly` with `registerShell` (from `@packages/core-module/shell`) and active modules, seeds mock data, and renders `<App />`. Shell components (RootLayout, LoginPage, NotFoundPage, UserMenu, auth MSW handlers) live in `@packages/core-module/shell`, not in the host. Domain logic lives in modules.
- **Modules**: Each feature area registers via `(runtime, queryClient) => Promise<void>`. The host wraps these in closures matching Squide's `ModuleRegisterFunction` signature. Modules are isolated — they never import from each other. When two modules need to share domain code: prefer duplication if the surface area is small; extract to a shared package under `packages/` (e.g., `@packages/core-module` for cross-module infrastructure, `@packages/core-plants` for plant domain logic) when it's large enough to justify the indirection.
- **Module registry**: `apps/host/src/getActiveModules.tsx` maps module path keys to their register functions. The host loads only modules present in this map.
- **Shared packages**: Three tiers live under `packages/`, each with a distinct scope:
    - `@packages/core-module` — Cross-module **infrastructure** any Squide app needs: session context, auth headers, auth error handling, MSW auth helpers, household types/schemas/DB (`./db` sub-path — `householdDb`, `usersDb`, `getUserId`), and the app shell (`./shell` sub-path — RootLayout, LoginPage, NotFoundPage, UserMenu, registerShell). Not domain-specific.
    - `@packages/core-plants` — Shared **plant-domain** code: types, DB schema, collection factories, plant-specific utilities and components. Subpath exports include `./collection`, `./db`, `./care-event` (care event types, schemas, insight utilities, and adjustment recommendation types/schemas/computation), `./vacation`, and `./test-utils`. Used by domain modules, not by generic packages like `components`.
    - `@packages/components` — Domain-agnostic **UI** (shadcn/ui + Tailwind v4). Could theoretically be extracted as a standalone design system.
    - If a utility is generic enough to be needed by `@packages/components`, it belongs in a new `core` package (doesn't exist yet), not in `core-module` or `core-plants`.
- **JIT packages**: Packages under `packages/` expose source directly via `exports` fields (e.g., `"./": "./src/index.ts"`). Consumers compile them at build time through their own bundler — no pre-build step is required. This means the Turborepo `dev` task has no `^dev` dependency; persistent watch builds in packages run in parallel, not as prerequisites. See [ODR-0004](odr/0004-jit-packages.md) for rationale.

See [ADR-0001](adr/0001-squide-local-modules.md) for rationale.

## Domain Storybooks

Two domains, each with independent Storybooks and Chromatic tokens:

- **management** — Admin and configuration (`apps/management/`)
- **today** — Daily care dashboard (`apps/today/`)

A packages-layer Storybook (`packages/storybook/`, `@apps/packages-storybook`) is purely a runner for shared package stories — it contains no exported utilities. Storybook infrastructure (MSW via `msw-storybook-addon`, Squide runtime via a `firefly.tsx` in each domain storybook app, collection context) is configured per-domain in each module's `storybook.setup.tsx`. A unified Storybook (`apps/storybook/`) aggregates all stories across the entire repo and is the sole target for browser verification (`pnpm dev-storybook`). Domain storybooks are used for Chromatic visual regression, a11y tests, and developer workflow.

See [ADR-0002](adr/0002-domain-scoped-storybooks.md) for rationale.

## Data layer — BFF-per-module

There is no backend server. MSW intercepts browser `fetch()` calls and serves from a shared in-memory database. TanStack DB provides an embedded client-side database with reactive live queries and built-in optimistic mutations, synced via TanStack Query. In production, MSW would be swapped for real API endpoints — the rest stays the same.

Each module owns its full API surface (a "BFF-per-module" model):

- **Collection** — Each module creates a TanStack DB collection during Squide registration via a factory from `@packages/core-plants/collection` and provides it to components via React Context. The host passes `QueryClient` to module registration functions. Components read data with `useLiveQuery` and write with `createOptimisticAction`.
- **Handlers** — MSW request handlers live in the module's `mocks/` folder, scoped to `/api/<domain>/<entity>` URLs (e.g., `/api/management/plants`, `/api/management/household`, `/api/today/plants`, `/api/management/user/profile`). Every module must own the MSW handlers for the endpoints it uses — never rely on the host or another module for handlers.
- **Shared DB** — All modules read/write the same in-memory plant store, exposed via `@packages/core-plants/db`. Cross-module visibility works through the shared DB, not shared client-side collections. A second shared DB, `householdDb`, lives in `@packages/core-module/db` and stores household, member, and invitation data — used by management-household, management-plants, today-landing-page, and the auth session handler. Modules may also own **module-local** in-memory DBs for entities that only one module consumes (e.g., `careEventsDb` in today-landing-page, `adjustmentsDb` in today-landing-page, `vacationDb` in today-vacation-planner). These are not shared — promote to a shared package only when a second module needs the same data.

Modules never share handlers or collections. If two modules need the same entity, each defines its own handlers, collection, and URL namespace. This mirrors how real BFFs work: each frontend surface has its own backend-for-frontend that shapes data for its needs.

**Auth layer** — The host owns `/api/auth/*` MSW handlers (login, logout, session) as a cross-cutting concern. The login handler stores the auth token in `sessionStorage`; the logout handler clears it. App code never reads or writes `sessionStorage` directly for auth — only transport-layer utilities (`getAuthHeaders()` and `getCurrentUserId()`) from `@packages/core-module` read the token to attach headers or derive the current user ID. Module handlers read this header to scope data per user.

See [ADR-0003](adr/0003-msw-tanstack-query-data-layer.md) for rationale. See `agent-docs/references/msw-tanstack-query.md` for implementation details.

## Technology stack

For exact versions, read the root `package.json` (`engines`, `packageManager`, `devDependencies`).

| Tool                | Purpose                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| Node.js             | Runtime                                                                              |
| pnpm                | Package manager                                                                      |
| TypeScript          | Type checking (`@typescript/native-preview` — tsgo)                                  |
| Squide              | Modular monolith shell (local modules)                                               |
| Storybook           | Component development                                                                |
| Chromatic           | Visual regression testing                                                            |
| Tailwind CSS        | Utility-first CSS framework (via `@tailwindcss/postcss`)                             |
| shadcn/ui (Base UI) | UI component library, base-nova preset (lives in `@packages/components`)             |
| Turborepo           | Task orchestration and caching                                                       |
| oxlint              | Fast JS/TS linter (zero config)                                                      |
| oxfmt               | Fast code formatter (Prettier-compatible, import sorting, Tailwind sort)             |
| Knip                | Dead code detection (unused files, deps, exports)                                    |
| Syncpack            | Dependency version enforcement                                                       |
| MSW                 | Mock Service Worker for API mocking in browser and Storybook                         |
| TanStack DB         | Embedded client-side database with reactive queries and optimistic mutations         |
| TanStack Query      | Server state management — syncs TanStack DB collections via `queryCollectionOptions` |
| TanStack Virtual    | List virtualization (`@tanstack/react-virtual`)                                      |
| Zod                 | Schema validation                                                                    |
| agent-browser       | Browser automation CLI for verifying UI changes                                      |

## Script conventions

Scripts in root `package.json` follow a prefix convention: `dev-*` (local dev servers), `build-*` / `serve-*` (production), `lint` / `typecheck` / `syncpack` (quality), `clean` / `reset` (maintenance). Read root `package.json` for the full list — never duplicate it in docs.

## MODULES env var

Set `MODULES` to load only specific modules during development:

```bash
cross-env MODULES=management/plants pnpm dev-host    # only management/plants
cross-env MODULES=today/landing-page pnpm dev-host   # only today/landing-page
```

Omit `MODULES` to load all modules. The value maps to the module's path under `apps/`.

## Maintaining this doc

- When a section exceeds ~40 lines, extract it to its own file in the appropriate `agent-docs/` subfolder.
- Cross-package contracts (e.g., "modules never import each other") belong here. Let the code (TypeScript types, barrel exports) document its own public API.
