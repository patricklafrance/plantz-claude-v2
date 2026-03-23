# plantz-claude-v2

A plants watering app used as a proof-of-concept for a **Claude Code agent harness**.

:point_right: App: https://plantz-claude.netlify.app/

:point_right: Storybook: https://plantz-claude-storybook.netlify.app/

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 10+

### Install

```bash
pnpm install
```

### Seed data

Plant data lives in an MSW in-memory database. Data resets on every reload — no manual seeding needed.

### Run the app

```bash
pnpm dev-host                      # Full app — all modules (http://localhost:8080)
pnpm dev-management-plants         # Just the plants module
pnpm dev-management-user           # Just the user profile module
pnpm dev-today-landing-page        # Just the today landing page module
pnpm dev-today-vacation-planner    # Just the vacation planner module
```

To load specific modules manually:

```bash
cross-env MODULES=management/plants pnpm dev-host
```

### Run Storybooks

```bash
pnpm dev-storybook               # Unified Storybook — all stories (http://localhost:6006)
pnpm dev-packages-storybook      # Shared components
pnpm dev-management-storybook    # Management domain
pnpm dev-today-storybook         # Today domain
```

### Run checks

```bash
pnpm lint          # ESLint (per-package, via Turborepo)
pnpm test          # Storybook a11y tests (Vitest + Playwright, via Turborepo)
pnpm oxlint        # oxlint (custom config in oxlintrc.json)
pnpm oxfmt         # Formatter check (oxfmt with Tailwind class sorting)
pnpm typecheck     # TypeScript (tsgo)
pnpm syncpack      # Dependency version consistency
pnpm knip          # Dead code detection (unused files, deps, exports)
```
