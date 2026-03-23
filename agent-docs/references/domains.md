# Domain Organization

## Decision Tree: "Where does feature X go?"

1. **Auth, session, layout, or app shell?** → `@packages/core-module/shell`
2. **Managing or configuring an entity?** → Management domain (`apps/management/`)
3. **What the user should do today?** → Today domain (`apps/today/`)
4. **Cross-module infrastructure?** → `@packages/core-module`
5. **Shared plant types, DB, collection factories?** → `@packages/core-plants`
6. **Reusable UI with no domain logic?** → `@packages/components`
7. **Generic utility needed by `@packages/components`?** → New `core` package (doesn't exist yet)

## Domains

| Domain         | Mental model            | Modules                  | Scope                                                                                                      |
| -------------- | ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **management** | Admin and configuration | `management/plants`      | Plant inventory ownership — CRUD, metadata, per-user plant collections                                     |
|                |                         | `management/user`        | User identity and preferences — profile editing, display settings                                          |
|                |                         | `management/household`   | Household membership — setup, invitations, member roles, shared access                                     |
| **today**      | Daily care dashboard    | `today/landing-page`     | Daily care execution — what needs attention now, watering actions, care event recording, schedule insights |
|                |                         | `today/vacation-planner` | Absence-aware care planning — trip dates, plant forecasts, delegation                                      |

The **host** is not a domain — it's a thin bootstrap wiring `registerShell` with domain modules.

## Module Isolation

Modules never import from each other. Small surface (a type, a constant): prefer duplication. Non-trivial shared logic: extract to `@packages/*`. This is a hard rule.
