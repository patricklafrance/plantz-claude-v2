# TanStack DB + TanStack Query + MSW

## Data Flow

1. Modules create a TanStack DB collection during Squide registration via `createPlantsCollection` factory from `@packages/core-plants/collection`, provided to components via React Context
2. Components read data with `useLiveQuery((q) => q.from({ plant: collection }))` — returns `{ data, isReady }`
3. Components write data with `createOptimisticAction` — applies optimistic update instantly, then persists to server
4. The collection's `queryFn` calls plain `fetch()` against domain-scoped endpoints (`/api/management/plants` or `/api/today/plants`)
5. MSW intercepts requests and serves from an in-memory `Map<string, Plant>` (shared DB in `@packages/core-plants/db`)
6. API client functions parse responses through `plantSchema.parse()` to convert ISO date strings to `Date` objects via `z.coerce.date()`

## Collection Factory

`@packages/core-plants/collection` exports shared factories:

```typescript
// Plants collection (used by management and watering modules)
const plantsCollection = createPlantsCollection({
    queryKey: ["management", "plants", "list"],
    queryFn: fetchPlants,
    queryClient
});

// Household collection (used by management module)
const householdCollection = createHouseholdCollection({
    queryKey: ["management", "household", "list"],
    queryFn: fetchHouseholds,
    queryClient
});
```

## Read-Only Data (fetch + useState)

Not all cross-module data needs a TanStack DB collection. For read-only data that does not require optimistic mutations, use plain `fetch` + `useState` in a custom hook:

```typescript
// Example: watering module reads household info (read-only, no mutations)
export function useHouseholdInfo() {
    const [household, setHousehold] = useState<Household | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        /* fetch /api/today/household */
    }, []);
    return { household, isLoading };
}
```

Use this pattern when the module only reads data owned by another module's API surface. The watering module uses this for household membership info (`useHouseholdInfo`) and responsibility assignments (`useAssignments`).

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

Every module registers its own MSW handlers in `src/mocks/`. Never rely on another module's handlers. The host only owns `/api/auth/*`. Module endpoints follow `/api/<domain>/<entity>`. Handlers share state through shared DB singletons (`plantsDb`, `usersDb`), not through shared handler code. This is a hard rule — without it, modules aren't independently loadable and Storybook stories break.

## Storybook Setup

MSW is managed globally via `msw-storybook-addon` (`initialize({ onUnhandledRequest: "bypass" })` + `mswLoader` in preview.tsx).

Each domain has a `storybook.setup.tsx` providing two decorators:

- `fireflyDecorator` — Squide runtime via `initializeFireflyForStorybook()` + `withFireflyDecorator()` from the domain storybook's `firefly.tsx`
- `collectionDecorator` — fresh `QueryClient` + collection context per story

Story files: `decorators: [collectionDecorator, fireflyDecorator]`, `parameters: { msw: { handlers: [...] } }`. Per-story overrides via `parameters.msw.handlers`. Use `delay("infinite")` for loading states. The packages storybook needs none of this (presentational only).
