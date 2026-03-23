# Management Domain

Local modules for plant management features.

## Stories

Never write stories without first loading the `plantz-adlc-code` skill for storybook conventions that apply to all domains.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Domain-Specific

- Title prefix: `Management/` (e.g., `Management/Plants/Pages/PlantsPage`, `Management/Plants/Components/PlantListItem`).
- Reference: `apps/management/plants/src/FilterBar.stories.tsx` (presentational component), `apps/management/plants/src/PlantsPage.stories.tsx` (page with collection + firefly decorators).
- Storybook dev command: `pnpm dev-management-storybook`.

## Storybook Setup

Each module has a `storybook.setup.tsx` that imports `initializeFireflyForStorybook` and `withFireflyDecorator` from the domain storybook's `firefly.tsx` (e.g., `../../storybook/firefly.tsx`), and creates a `CollectionDecorator` providing a fresh `QueryClient` + collection context per story. Story files import `collectionDecorator` and `fireflyDecorator` from `./storybook.setup.tsx` and add both to `decorators: [collectionDecorator, fireflyDecorator]`. MSW is managed globally via `msw-storybook-addon` in preview.tsx; per-story handlers use `parameters.msw.handlers`. Presentational component stories (e.g., FilterBar, DeleteConfirmDialog) don't need the decorators.

## Storybook Wiring

Domain storybook: `@apps/management-storybook` (`apps/management/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx` (where `{module}` is the directory name under `apps/management/`, e.g., `plants`).

## Data Layer

Modules in this domain own their API surface under `/api/management/`. Each module has:

- `src/plantsCollection.ts` — TanStack DB collection factory (`createManagementPlantsCollection`) called during registration + optimistic actions via `createOptimisticAction`. The collection is provided to components via `ManagementPlantsCollectionProvider` React Context.
- `src/mocks/` — MSW handlers scoped to `/api/management/<entity>`

Components read with `useLiveQuery` and write with actions from `createManagementPlantActions`. No `api/` folder — the collection handles data fetching internally via `queryCollectionOptions`.

See `msw-tanstack-query.md` in `.claude/skills/plantz-adlc-*/references/` for implementation patterns.

## Adding a Module

Use `/scaffold-domain-module` with `domain=management`. The skill handles host registration, storybook wiring, and affected-detection updates.
