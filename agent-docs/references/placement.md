# Code Placement

## Decision Tree: "Where does feature X go?"

1. **Auth, session, layout, or app shell?** → `@packages/core-module/shell`
2. **Plant inventory, plant configuration, or user account?** → `@modules/management`
3. **Daily watering tasks or vacation planning?** → `@modules/watering`
4. **Cross-module infrastructure?** → `@packages/core-module`
5. **Shared plant types, DB, collection factories?** → `@packages/core-plants`
6. **Shared household types, membership, responsibility?** → `@packages/core-household`
7. **Reusable UI with no feature logic?** → `@packages/components`

## Modules

| Module             | Scope                                                                                                        | Subfolders                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `@modules/management` | Plant identity, ownership, configuration, and user account/preferences.                                   | `inventory/`, `account/`            |
| `@modules/watering`   | Daily care execution (what needs the user's attention now) and absence-aware care planning (vacation mode). | `today/`, `vacation-planner/`       |

The **host** (`apps/host-app/`) is not a module — it's a thin bootstrap wiring `registerShell` with modules.

### Subfolder placement

Within a module, pick the subfolder by asking: _Which area of concern does this feature serve?_

- **management/inventory/** — Plant CRUD, plant details, plant list views
- **management/account/** — User profile, preferences, settings
- **watering/today/** — Daily care dashboard, care events, watering actions
- **watering/vacation-planner/** — Vacation scheduling, delegation, absence care plans

Subfolders are internal organizational boundaries — they share the same package scope, build config, and registration function.

## Packages

| Package                 | Responsibility                                                                              | Anti-scope                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `@packages/core-module` | Authentication, session management, user identity, shell UI (layout, navigation, login)     | No feature-specific business logic. No plant or household data. |
| `@packages/core-plants` | Shared plant types, schemas, UI components, collection factories, care event display         | No app-specific routing or page components. No authentication. |
| `@packages/components`  | Reusable design-system primitives (shadcn/ui) with zero feature logic                        | No data fetching. No feature types. No business logic.          |

## Module Isolation

Modules never import from each other. Small surface (a type, a constant): prefer duplication. Non-trivial shared logic: extract to `@packages/*`. This is a hard rule.
