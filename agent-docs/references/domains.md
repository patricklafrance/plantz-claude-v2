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

| Domain         | Mental model            | Modules                  | Scope                                                                                    |
| -------------- | ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| **management** | Admin and configuration | `management/plants`      | Plant identity and ownership — what a plant _is_ and who owns it.                        |
|                |                         | `management/user`        | User identity and preferences — who the user is and how they configure their experience. |
| **today**      | Daily care dashboard    | `today/landing-page`     | Daily care execution — what needs the user's attention right now.                        |
|                |                         | `today/vacation-planner` | Absence-aware care planning — managing periods when the user can't perform regular care. |

The **host** is not a domain — it's a thin bootstrap wiring `registerShell` with domain modules.

## Module Isolation

Modules never import from each other. Small surface (a type, a constant): prefer duplication. Non-trivial shared logic: extract to `@packages/*`. This is a hard rule.
