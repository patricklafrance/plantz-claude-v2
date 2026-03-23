# Plant CRUD & List — Feature Prompt

## Pre-work

Before writing any code:

1. Read the `CLAUDE.md` index and load `agent-docs/ARCHITECTURE.md` — the plant CRUD lives in `apps/management/plants/`, not a new top-level directory.
2. Load these agent skills: `frontend-design`, `shadcn`, `workleap-squide`.
3. Read `packages/components/CLAUDE.md` for the component authoring workflow — every new shadcn component must follow that checklist.

## Overview

Implement two features for the plants watering application:

- **Plant CRUD** — Create, Read/Update, and Delete plants via modals opened from the list page.
- **Plant list** — A virtualized, filterable, sortable list of all plants.

Data is client-side only, persisted in localStorage via TanStack DB.

---

## Phase 1: Data layer + seed

### Plant record schema

Define a Zod schema for the persisted plant record. `firstWateringDate` is a form-only field — it is NOT persisted.

| Field             | Type    | Required | Persisted |
| ----------------- | ------- | -------- | --------- |
| id                | string  | Yes      | Yes       |
| name              | string  | Yes      | Yes       |
| description       | string  | No       | Yes       |
| family            | string  | No       | Yes       |
| location          | string  | Yes      | Yes       |
| luminosity        | string  | Yes      | Yes       |
| mistLeaves        | boolean | Yes      | Yes       |
| soilType          | string  | No       | Yes       |
| wateringFrequency | string  | Yes      | Yes       |
| wateringQuantity  | string  | Yes      | Yes       |
| wateringType      | string  | Yes      | Yes       |
| nextWateringDate  | Date    | Yes      | Yes       |
| creationDate      | Date    | Yes      | Yes       |
| lastUpdateDate    | Date    | Yes      | Yes       |

### TanStack DB setup

Use `@tanstack/react-db` for data queries and mutations. This package re-exports everything from `@tanstack/db` — no additional collection packages are needed.

Install in the plants module:

```
pnpm add @tanstack/react-db
```

#### Creating a collection

```typescript
import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";

export const plantsCollection = createCollection(
    localStorageCollectionOptions({
        id: "plants",
        storageKey: "plantz-plants",
        getKey: (item: Plant) => item.id,
        schema: plantSchema,
    }),
);
```

#### CRUD mutations

LocalStorage collections use direct mutations — no server sync handlers needed.

```typescript
// Insert
plantsCollection.insert({ id: crypto.randomUUID(), name: "Monstera", ... });

// Update (Immer-style draft)
plantsCollection.update(plantId, (draft) => {
    draft.name = "Updated Name";
    draft.lastUpdateDate = new Date();
});

// Delete
plantsCollection.delete(plantId);
```

#### Querying with useLiveQuery

```typescript
import { useLiveQuery, eq, and } from "@tanstack/react-db";

const { data: plants } = useLiveQuery((q) =>
    q
        .from({ plant: plantsCollection })
        .where(({ plant }) => eq(plant.location, "kitchen"))
        .orderBy(({ plant }) => plant.name, "asc"),
);
```

When filter values come from React state, pass a dependency array so the query re-executes:

```typescript
const [location, setLocation] = useState<string | null>(null);

const { data } = useLiveQuery(
    (q) => {
        let query = q.from({ plant: plantsCollection });
        if (location) {
            query = query.where(({ plant }) => eq(plant.location, location));
        }
        return query;
    },
    [location],
);
```

Available filter operators: `eq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `inArray`, `and`, `or`, `not`, `isNull`, `isUndefined`.

#### Date serialization warning

localStorage serializes Date objects as JSON strings. Define date fields in the Zod schema using a coerce or transform so dates round-trip correctly:

```typescript
nextWateringDate: z.coerce.date();
```

Without this, `collection.update()` will fail because the draft contains a string but the schema expects a Date.

### Business rules

- **nextWateringDate computation:** On create, `nextWateringDate = firstWateringDate`. When `wateringFrequency` is updated on an existing plant, do NOT recompute `nextWateringDate` — it stays as-is until a future "mark as watered" feature changes it.
- **Due for watering:** A plant is due for watering when `nextWateringDate <= today` (comparing date only, ignoring time).

### Seed

Create a seed function at `apps/management/plants/src/seed.ts` that:

- Inserts 200–300 plants using `plantsCollection.insert()`.
- Uses real plant species names (e.g., Monstera Deliciosa, Fiddle Leaf Fig, Snake Plant, Pothos, etc.) as the `name` field and real family names (e.g., Araceae, Moraceae, Asparagaceae).
- Distributes plants across all locations, luminosities, watering frequencies, and watering types.
- Generates `nextWateringDate` values so that ~20% of plants are due for watering today or earlier.
- Runs automatically on app startup only when the collection is empty.
- Provide a "Reseed" button somewhere in the UI that clears the collection and re-runs the seed.

### Phase 1 verification

- `pnpm typecheck` passes.
- Run `pnpm dev-host` with `MODULES=management/plants` — the app loads without console errors.
- Seed runs on first load; 200+ plants appear in localStorage under the `plantz-plants` key.
- Data persists across page reloads.

---

## Phase 2: Plant list

### List page

The existing `PlantsPage.tsx` at `apps/management/plants/src/` becomes the list page. It should display all plants in a **virtualized list** using `@tanstack/react-virtual`. Do NOT implement infinite scrolling — all data is local, so virtualization alone handles smooth rendering of 200+ items.

Each list item should display:

- Plant name
- Watering quantity and watering type
- Location
- A visual indicator if the plant is due for watering
- An "Edit" button (opens the Read/Update modal — Phase 3)
- A checkbox for bulk selection

### Filtering

Display a horizontal filter bar above the list with these filters:

| Filter            | Display text       | UI component                       |
| ----------------- | ------------------ | ---------------------------------- |
| location          | Location           | Select (Location values)           |
| luminosity        | Luminosity         | Select (Luminosity values)         |
| mistLeaves        | Mist leaves        | Switch                             |
| soilType          | Soil type          | TextInput                          |
| wateringFrequency | Watering frequency | Select (Watering frequency values) |
| wateringType      | Watering type      | Select (Watering type values)      |
| dueForWatering    | Due for watering   | Switch                             |

Filters are AND-ed. The `soilType` text filter uses case-insensitive substring match. Include a "Clear filters" action.

### Sorting

Default sort: ascending by `name`, then ascending by `family`, then descending by `lastUpdateDate`.

### Bulk delete

Each list item has a checkbox. When one or more items are checked, show a bulk action bar with a "Delete selected" button. Include a "Select all" checkbox in the list header. Deleting shows a confirmation dialog (use shadcn AlertDialog) listing the names of selected plants. On confirm, delete all selected plants and refresh the list.

### Phase 2 verification

- The list renders 200+ seeded plants.
- DOM contains fewer than 50 row elements at any time (virtualization is active).
- Each filter narrows the list correctly; "Clear filters" resets to full list.
- Bulk select + delete removes plants and they stay gone after page reload.

---

## Phase 3: Create, Read/Update, Delete

### Create

A "New plant" button on the list page opens a modal (use shadcn Dialog) with a form to create a plant.

Form fields:

| Field             | Display text        | UI component                       | Required | Default value |
| ----------------- | ------------------- | ---------------------------------- | -------- | ------------- |
| name              | Name                | TextInput                          | Yes      | -             |
| description       | Description         | TextArea                           | No       | -             |
| family            | Family              | TextInput                          | No       | -             |
| location          | Location            | Select (Location values)           | Yes      | living-room   |
| luminosity        | Luminosity          | Select (Luminosity values)         | Yes      | medium        |
| mistLeaves        | Mist leaves         | Switch                             | Yes      | true          |
| soilType          | Soil type           | TextInput                          | No       | -             |
| wateringFrequency | Watering frequency  | Select (Watering frequency values) | Yes      | 1-week        |
| wateringQuantity  | Watering quantity   | TextInput                          | Yes      | -             |
| wateringType      | Watering type       | Select (Watering type values)      | Yes      | surface       |
| firstWateringDate | First watering date | DatePicker                         | Yes      | Tomorrow      |

On submit: validate all required fields (show inline field errors, keep submit button disabled until valid). Create the plant record with `creationDate = now`, `lastUpdateDate = now`, `nextWateringDate = firstWateringDate`. Close the modal and refresh the list.

### Read / Update

Each list item's "Edit" button opens a modal showing the plant's details. All fields are editable except `nextWateringDate` (read-only). Auto-save each field change with a 500ms debounce. Show a subtle "Saved" indicator on successful save. Update `lastUpdateDate` on every save.

The modal also has a "Delete" button (triggers the same delete confirmation as the list).

Fields displayed:

| Field             | Display text       | UI component                       | Required | Editable |
| ----------------- | ------------------ | ---------------------------------- | -------- | -------- |
| name              | Name               | TextInput                          | Yes      | Yes      |
| description       | Description        | TextArea                           | No       | Yes      |
| family            | Family             | TextInput                          | No       | Yes      |
| location          | Location           | Select (Location values)           | Yes      | Yes      |
| luminosity        | Luminosity         | Select (Luminosity values)         | Yes      | Yes      |
| mistLeaves        | Mist leaves        | Switch                             | Yes      | Yes      |
| soilType          | Soil type          | TextInput                          | No       | Yes      |
| wateringFrequency | Watering frequency | Select (Watering frequency values) | Yes      | Yes      |
| wateringQuantity  | Watering quantity  | TextInput                          | Yes      | Yes      |
| wateringType      | Watering type      | Select (Watering type values)      | Yes      | Yes      |
| nextWateringDate  | Next watering date | DatePicker                         | Yes      | No       |

### Delete (single)

Each list item also has a delete button (in addition to the edit button). Clicking it shows a confirmation dialog (shadcn AlertDialog) with the plant's name. On confirm, delete and refresh the list.

### Select option values

#### Location

| Id          | Display text |
| ----------- | ------------ |
| basement    | Basement     |
| bathroom    | Bathroom     |
| bedroom     | Bedroom      |
| dining-room | Dining room  |
| living-room | Living room  |
| kitchen     | Kitchen      |

#### Luminosity

| Id     | Display text |
| ------ | ------------ |
| low    | Low          |
| medium | Medium       |
| high   | High         |

#### Watering frequency

| Id        | Display text |
| --------- | ------------ |
| 0.5-week  | 0.5 week     |
| 1-week    | 1 week       |
| 1.5-weeks | 1.5 weeks    |
| 2-weeks   | 2 weeks      |
| 2.5-weeks | 2.5 weeks    |

#### Watering type

| Id      | Display text |
| ------- | ------------ |
| deep    | Deep         |
| surface | Surface      |

### Phase 3 verification

- Create a plant → it appears in the list and persists across reload.
- Edit a plant → changes auto-save and persist across reload.
- Delete a single plant via list button → confirmation dialog → plant removed.
- Delete a single plant via edit modal → confirmation dialog → plant removed, modal closes.

---

## Phase 4: Polish

### Logo

Create an inline SVG logo (a simple plant/leaf icon with the text "Plantz") and add it to the app layout header.

### Shared components

Any reusable UI components created during this work (e.g., TextArea, Select, Switch, TextInput, AlertDialog, Dialog) should be added to `packages/components/` following the workflow in `packages/components/CLAUDE.md`. Components already there: Button, Calendar, DatePicker, Popover.

### Agent documentation

Create `agent-docs/references/tanstack-db.md` documenting:

- The package used and its version.
- Where the collection is defined (file path).
- The localStorage key (`plantz-plants`).
- The Zod schema with date coercion pattern.
- CRUD mutation patterns (insert, update with draft, delete).
- Query patterns with `useLiveQuery` including dynamic filters with dependency arrays.
- How the seed function works and how to re-trigger it.

Add an index entry in root `CLAUDE.md` under References:

```
- [references/tanstack-db.md](agent-docs/references/tanstack-db.md) — TanStack DB collection setup, CRUD patterns, localStorage persistence
```

### Phase 4 verification

- Logo renders in the layout header.
- All new components in `packages/components/` have `.stories.tsx` files and are exported from `src/index.ts`.
- `pnpm typecheck` passes from repo root.
- `agent-docs/references/tanstack-db.md` exists and is indexed in `CLAUDE.md`.
- `git status --short` — verify every changed file is intentional and no unrelated files were modified.
