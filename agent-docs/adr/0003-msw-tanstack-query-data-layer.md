# ADR-0003: No Backend Server — MSW + TanStack DB as Data Layer with BFF-per-Module

## Status

accepted

## Decision

The app has no backend process. MSW intercepts browser `fetch()` calls and serves from an in-memory store. TanStack DB provides an embedded client-side database with reactive live queries (`useLiveQuery`) and built-in optimistic mutations (`createOptimisticAction`), synced via TanStack Query through `queryCollectionOptions`. Components use real REST patterns that would point at a real API in production — MSW is the only thing that would be swapped out.

A standalone local API server (e.g., json-server) was rejected because it adds process management complexity and complicates Storybook and CI environments.

### Per-module collections

Each module creates its own TanStack DB collection during Squide registration using the `createPlantsCollection` factory from `@packages/core-plants/collection`. The host creates `QueryClient` first and passes it to module registration functions. The collection is provided to components via React Context (e.g., `ManagementPlantsCollectionProvider` / `useManagementPlantsCollection()`). In Storybook, a `CollectionDecorator` creates a fresh `QueryClient` and collection per story via `useMemo`.

### BFF-per-module constraint

Each Squide module owns its entire API surface — handlers, collection, and URL namespace — scoped under a domain URL namespace (`/api/<domain>/<entity>`). Modules never share handlers or collections. The shared data dependencies are in-memory DB singletons: `plantsDb` in `@packages/core-plants/db` and `householdDb` in `@packages/core-module/db`. Cross-module data visibility works through the shared DBs, not through shared client-side state.

This mirrors a real BFF (backend-for-frontend) architecture: each frontend surface shapes its own API layer. It also reinforces the module isolation rule from [ADR-0001](0001-squide-local-modules.md) — modules stay independently deployable at the data layer, not just the UI layer.

## Consequences

- Data resets on page reload (intentional for POC).
- Adding a new module requires creating its own `plantsCollection.ts` and `mocks/` folder with module-scoped handlers and collection — even if the entity already exists in another module.
- URL namespaces must not collide between modules.
- TanStack DB is beta — pin exact versions and monitor for breaking changes.
- Domain modules need a `storybook.setup.tsx` wiring `initializeFireflyForStorybook` + `withFireflyDecorator` from the domain storybook's `firefly.tsx`, and a `CollectionDecorator` for per-story collection context. MSW is managed globally via `msw-storybook-addon` in preview.tsx.

See `agent-docs/references/msw-tanstack-query.md` for implementation patterns.
