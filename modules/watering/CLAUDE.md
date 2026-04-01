# Watering Module

Daily plant care features: today (landing page with care actions) and vacation-planner.

## Stories

Never write stories without first loading the `plantz-adlc-code` skill for storybook conventions that apply to all modules.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Module-Specific

- Title prefix: `Watering/Today/` for today subfolder (e.g., `Watering/Today/Pages/LandingPage`).
- Title prefix: `Watering/VacationPlanner/` for vacation-planner subfolder (e.g., `Watering/VacationPlanner/Pages/VacationPlannerPage`).
- Reference: `modules/watering/src/today/LandingPage.stories.tsx`.
- Storybook dev command: `pnpm dev-watering-storybook`.

## Storybook Setup

Each subfolder (under `src/`) has a `storybook.setup.tsx` that imports `initializeFireflyForStorybook` and `withFireflyDecorator` from the storybook's `firefly.tsx` (e.g., `../../../../apps/watering-storybook/firefly.tsx`), and creates a `CollectionDecorator` providing a fresh `QueryClient` + collection context per story. Story files import `collectionDecorator` and `fireflyDecorator` from `./storybook.setup.tsx` and add both to `decorators: [collectionDecorator, fireflyDecorator]`. MSW is managed globally via `msw-storybook-addon` in preview.tsx; per-story handlers use `parameters.msw.handlers`. Presentational component stories don't need the decorators.

## Storybook Wiring

Module storybook: `@apps/watering-storybook` (`apps/watering-storybook/`).

Story globs in `.storybook/main.ts` must include every subfolder in this module. When adding a subfolder, add its glob: `../../../modules/watering/src/{subfolder}/**/*.stories.tsx`.

## Data Layer

This module owns its API surface under `/api/today/`. Each subfolder has:

- `src/plantsCollection.ts` — TanStack DB collection factory (`createTodayPlantsCollection`) called during registration + optimistic actions via `createOptimisticAction`. The collection is provided to components via `TodayPlantsCollectionProvider` React Context.
- `src/mocks/` — MSW handlers scoped to `/api/today/<entity>`

Components read with `useLiveQuery`. Mutations go through MSW handlers (`DELETE /api/today/plants/:id` and `DELETE /api/today/plants`). No `api/` folder -- the collection handles data fetching internally via `queryCollectionOptions`.

See `msw-tanstack-query.md` in `.claude/skills/plantz-adlc-*/references/` for implementation patterns.
