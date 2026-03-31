# Code Placement

## Decision Tree: "Where does feature X go?"

1. **Auth, session, layout, or app shell?** → `@packages/core-module/shell`
2. **Managing or configuring an entity?** → Management domain (`apps/management/`)
3. **What the user should do today?** → Today domain (`apps/today/`)
4. **Cross-module infrastructure?** → `@packages/core-module`
5. **Shared plant types, DB, collection factories?** → `@packages/core-plants`
6. **Shared household types, membership, responsibility?** → `@packages/core-household`
7. **Reusable UI with no domain logic?** → `@packages/components`

## Domains

| Domain         | Mental model            | Modules                  | Scope                                                                                    |
| -------------- | ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| **management** | Admin and configuration | `management/plants`      | Plant identity and ownership — what a plant _is_ and who owns it.                        |
|                |                         | `management/user`        | User identity and preferences — who the user is and how they configure their experience. |
| **today**      | Daily care dashboard    | `today/landing-page`     | Daily care execution — what needs the user's attention right now.                        |
|                |                         | `today/vacation-planner` | Absence-aware care planning — managing periods when the user can't perform regular care. |

The **host** is not a domain — it's a thin bootstrap wiring `registerShell` with domain modules.

## Packages

| Package                 | Responsibility                                                                              | Anti-scope                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `@packages/core-module` | Authentication, session management, user identity, shell UI (layout, navigation, login)     | No domain-specific business logic. No plant or household data. |
| `@packages/core-plants` | Shared plant types, schemas, domain UI components, collection factories, care event display | No app-specific routing or page components. No authentication. |
| `@packages/components`  | Reusable design-system primitives (shadcn/ui) with zero domain logic                        | No data fetching. No domain types. No business logic.          |

## Module Isolation

Modules never import from each other. Small surface (a type, a constant): prefer duplication. Non-trivial shared logic: extract to `@packages/*`. This is a hard rule.
