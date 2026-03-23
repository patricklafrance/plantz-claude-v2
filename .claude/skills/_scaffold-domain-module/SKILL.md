---
name: _scaffold-domain-module
description: Scaffold a new Squide local module in the monorepo.
license: MIT
---

# Scaffold Module

Create a new Squide local module with all required registrations.

## Inputs

| Input    | Description                    |
| -------- | ------------------------------ |
| `domain` | Domain directory under `apps/` |
| `module` | Module name                    |

## Naming derivation

All names are mechanically derived from `domain` and `module`. **PascalCase** means split on `-`, capitalize each segment's first letter, join (e.g., `landing-page` → `LandingPage`).

| Name              | Formula                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Package name      | `@modules/{domain}-{module}`                                                  |
| Directory         | `apps/{domain}/{module}/`                                                     |
| Register function | `register` + PascalCase(domain) + PascalCase(module)                          |
| Page component    | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`) |
| Register file     | `src/{registerFunction}.tsx`                                                  |
| Page file         | `src/{PageComponent}.tsx`                                                     |
| `$id`             | `{domain}-{module}`                                                           |
| Registry key      | `{domain}/{module}`                                                           |
| Route path        | `/{domain}/{module}`                                                          |
| Nav label         | PascalCase(module) with spaces between words                                  |
| Dev script        | `dev-{domain}-{module}`                                                       |

## Reference module

`apps/management/plants/` is the canonical reference. Before creating any file, read these 5 files: `package.json`, `tsconfig.json`, `src/index.ts`, `src/registerManagementPlants.tsx`, `src/PlantsPage.tsx`.

Reproduce the same 5-file skeleton with substituted names. Copy dependency versions and scripts exactly — never hardcode versions from memory.

## Process

### 1. Validate

- Confirm `apps/{domain}/` exists. If not, ask the user.
- Confirm `apps/{domain}/{module}/` does NOT exist. If it does, stop.

### 2. Create module files

Create only these 5 files — no domain-specific source files (dialogs, schemas, collections, stories).

| File                         | Substitutions                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `package.json`               | Name, description. `license`: `"Apache-2.0"`, `author`: `"Patrick Lafrance"`. Copy `workspace:*` deps only. |
| `tsconfig.json`              | Identical copy.                                                                                             |
| `src/index.ts`               | Barrel export of the register function.                                                                     |
| `src/{registerFunction}.tsx` | Register function name, route path, `$id`, nav label, page component import.                                |
| `src/{PageComponent}.tsx`    | Component name.                                                                                             |

### 3. Register in host

1. `apps/host/src/getActiveModules.tsx` — add import and `ModuleRegistry` entry.
2. `apps/host/package.json` — add `"{packageName}": "workspace:*"` to dependencies.
3. `apps/host/src/styles/globals.css` — add `@source` directive for the new module.

### 4. Update domain storybook

In `apps/{domain}/storybook/.storybook/`:

1. `storybook.css` — add `@source "../../{module}/src/**/*.{ts,tsx}";`
2. `main.ts` — add `"../../{module}/src/**/*.stories.tsx"` to the stories array.

If the domain storybook doesn't exist yet, skip and warn.

### 5. Update unified storybook

In `apps/storybook/.storybook/`:

1. `main.ts` — add story glob under the `// {DomainTitle}` comment section.
2. `storybook.css` — add `@source "../../{domain}/{module}/src/**/*.{ts,tsx}";`

### 6. Update affected map

In `scripts/get-affected-storybooks.ts`, add the package name to the `StorybookDependencies` entry for `@apps/{domain}-storybook`.

Only list module package names (`@modules/*`) — never shared packages.

### 7. Add dev script

In root `package.json`, add:

```
"dev-{domain}-{module}": "cross-env MODULES={domain}/{module} pnpm dev-host"
```

### 8. Install and verify

1. Run `pnpm install`.
2. Run `pnpm lint` — fix any issues.
