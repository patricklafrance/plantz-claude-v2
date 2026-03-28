# TanStack DB + TanStack Query + MSW

## Data Flow

1. Modules create a TanStack DB collection during Squide registration, provided to components via React Context. Plant modules use `createPlantsCollection` from `@packages/core-plants/collection`; non-plant modules (e.g., `management/household`) define their own collection factory following the same `createCollection` + `queryCollectionOptions` pattern.
2. Components read data with `useLiveQuery((q) => q.from({ plant: collection }))` — returns `{ data, isReady }`
3. Components write data with `createOptimisticAction` — applies optimistic update instantly, then persists to server
4. The collection's `queryFn` calls plain `fetch()` against domain-scoped endpoints (`/api/management/plants`, `/api/today/plants`, `/api/management/households`)
5. MSW intercepts requests and serves from shared in-memory DBs (`plantsDb`, `householdsDb`, `membersDb`, `assignmentsDb`, `usersDb`)
6. API client functions parse responses through Zod schemas (e.g., `plantSchema.parse()`) to convert ISO date strings to `Date` objects via `z.coerce.date()`

### Supplementary fetch+useState pattern

Not all data needs a TanStack DB collection. Read-mostly, bounded-size data that does not need optimistic mutations or cross-view reactivity can use plain `fetch` + `useState` + `useEffect`. Examples: household member lists, responsibility assignments, watered-today status. This avoids the overhead of a collection for data that is fetched once and updated infrequently.

## Collection Factory

`@packages/core-plants/collection` exports the shared factory:

```typescript
const collection = createPlantsCollection({
    queryKey: ["management", "plants", "list"],
    queryFn: fetchPlants,
    queryClient
});
```

## Optimistic Mutations

`createOptimisticAction` returns a `Transaction`, not a `Promise`. Use `tx.isPersisted.promise` for async callbacks.

```typescript
const updatePlant = createOptimisticAction<{ id: string } & Partial<Plant>>({
    onMutate: ({ id, ...changes }) => {
        collection.update(id, draft => {
            Object.assign(draft, changes);
        });
    },
    mutationFn: async ({ id, ...data }) => {
        await fetch(`${API_BASE}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        await collection.utils.refetch();
    }
});
```

## Host App (Squide Integration)

The host creates `QueryClient` before `initializeFirefly` and passes it to module registrations. `getActiveModules` wraps module registrations in closures: `(runtime) => entry.register(runtime, queryClient)`.

## Module Registration

Each module accepts `(runtime, queryClient)`, creates its collection, provides it via React Context, and conditionally registers MSW handlers:

```typescript
export async function registerManagementPlants(runtime: FireflyRuntime, queryClient: QueryClient) {
    const collection = createManagementPlantsCollection(queryClient);
    registerRoutes(runtime, collection);
    if (runtime.isMswEnabled) {
        const { managementPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
    }
}
```

## Module-Specific Handlers

Every module registers its own MSW handlers in `src/mocks/`. Never rely on another module's handlers. The host only owns `/api/auth/*`. Module endpoints follow `/api/<domain>/<entity>`, with sub-resources at `/api/<domain>/<entity>/:id/<sub-entity>` (e.g., `/api/management/households/:id/members`). Handlers share state through shared DB singletons (`plantsDb`, `usersDb`, `householdsDb`, `membersDb`, `assignmentsDb`), not through shared handler code. This is a hard rule — without it, modules aren't independently loadable and Storybook stories break.

## Storybook Setup

MSW is managed globally via `msw-storybook-addon` (`initialize({ onUnhandledRequest: "bypass" })` + `mswLoader` in preview.tsx).

Each domain has a `storybook.setup.tsx` providing two decorators:

- `fireflyDecorator` — Squide runtime via `initializeFireflyForStorybook()` + `withFireflyDecorator()` from the domain storybook's `firefly.tsx`
- `collectionDecorator` — fresh `QueryClient` + collection context per story

Story files: `decorators: [collectionDecorator, fireflyDecorator]`, `parameters: { msw: { handlers: [...] } }`. Per-story overrides via `parameters.msw.handlers`. Use `delay("infinite")` for loading states. The packages storybook needs none of this (presentational only).
