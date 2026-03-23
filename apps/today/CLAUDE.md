# Today Domain

Local modules for the daily plant care view.

## Stories

Never write stories without first loading the `plantz-adlc-code` skill for storybook conventions that apply to all domains.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Domain-Specific

- Title prefix: `Today/` (e.g., `Today/LandingPage/Pages/LandingPage`).
- Reference: `apps/today/landing-page/src/LandingPage.stories.tsx`.
- Storybook dev command: `pnpm dev-today-storybook`.

## Storybook Setup

Each module has a `storybook.setup.tsx` that imports `initializeFireflyForStorybook` and `withFireflyDecorator` from the domain storybook's `firefly.tsx` (e.g., `../../storybook/firefly.tsx`), and creates a `CollectionDecorator` providing a fresh `QueryClient` + collection context per story. Story files import `collectionDecorator` and `fireflyDecorator` from `./storybook.setup.tsx` and add both to `decorators: [collectionDecorator, fireflyDecorator]`. MSW is managed globally via `msw-storybook-addon` in preview.tsx; per-story handlers use `parameters.msw.handlers`. Presentational component stories don't need the decorators.

## Storybook Wiring

Domain storybook: `@apps/today-storybook` (`apps/today/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx` (where `{module}` is the directory name under `apps/today/`, e.g., `landing-page`).

## Data Layer

Modules in this domain own their API surface under `/api/today/`. Each module has:

- `src/plantsCollection.ts` — TanStack DB collection factory (`createTodayPlantsCollection`) called during registration + optimistic actions via `createOptimisticAction`. The collection is provided to components via `TodayPlantsCollectionProvider` React Context.
- `src/mocks/` — MSW handlers scoped to `/api/today/<entity>`

Components read with `useLiveQuery`. Mutations go through MSW handlers (`DELETE /api/today/plants/:id` and `DELETE /api/today/plants`). No `api/` folder — the collection handles data fetching internally via `queryCollectionOptions`.

See `msw-tanstack-query.md` in `.claude/skills/plantz-adlc-*/references/` for implementation patterns.

## Adding a Module

Use `/scaffold-domain-module` with `domain=today`. The skill handles host registration, storybook wiring, and affected-detection updates.
