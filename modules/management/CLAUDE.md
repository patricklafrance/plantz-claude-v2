# Management Module

Plant management features: inventory (plants CRUD), account (user profile), and household (household CRUD, member management).

## Stories

Never write stories without first loading the `plantz-adlc-code` skill for storybook conventions that apply to all modules.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Module-Specific

- Title prefix: `Management/Inventory/` for inventory subfolder (e.g., `Management/Inventory/Pages/PlantsPage`, `Management/Inventory/Components/FilterBar`).
- Title prefix: `Management/Account/` for account subfolder (e.g., `Management/Account/Pages/UserPage`).
- Title prefix: `Management/Household/` for household subfolder (e.g., `Management/Household/Pages/HouseholdPage`).
- Reference: `modules/management/src/inventory/FilterBar.stories.tsx` (presentational component), `modules/management/src/inventory/PlantsPage.stories.tsx` (page with collection + firefly decorators).
- Storybook dev command: `pnpm dev-storybook-management`.

## Storybook Setup

Each subfolder (under `src/`) has a `storybook.setup.tsx` that imports `initializeFireflyForStorybook` and `withFireflyDecorator` from the storybook's `firefly.tsx` (e.g., `../../../../apps/storybook-management/firefly.tsx`), and creates a `CollectionDecorator` providing a fresh `QueryClient` + collection context per story. Story files import `collectionDecorator` and `fireflyDecorator` from `./storybook.setup.tsx` and add both to `decorators: [collectionDecorator, fireflyDecorator]`. MSW is managed globally via `msw-storybook-addon` in preview.tsx; per-story handlers use `parameters.msw.handlers`. Presentational component stories (e.g., FilterBar, DeleteConfirmDialog) don't need the decorators.

## Storybook Wiring

Module storybook: `@apps/storybook-management` (`apps/storybook-management/`).

Story globs in `.storybook/main.ts` must include every subfolder in this module. When adding a subfolder, add its glob: `../../../modules/management/src/{subfolder}/**/*.stories.tsx`.

## Data Layer

This module owns its API surface under `/api/management/`. Each subfolder has:

- `src/plantsCollection.ts` — TanStack DB collection factory (`createManagementPlantsCollection`) called during registration + optimistic actions via `createOptimisticAction`. The collection is provided to components via `ManagementPlantsCollectionProvider` React Context.
- `src/mocks/` — MSW handlers scoped to `/api/management/<entity>`

Components read with `useLiveQuery` and write with actions from `createManagementPlantActions`. No `api/` folder -- the collection handles data fetching internally via `queryCollectionOptions`.

See `msw-tanstack-query.md` in `.claude/skills/plantz-adlc-*/references/` for implementation patterns.
