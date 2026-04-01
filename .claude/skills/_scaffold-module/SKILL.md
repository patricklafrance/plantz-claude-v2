---
name: _scaffold-module
description: Scaffold a new Squide local module or subfolder in the monorepo.
license: MIT
---

# Scaffold Module

Create a new Squide local module or add a subfolder to an existing module.

## Inputs

| Input       | Description                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `module`    | Module name (e.g., `management`, `watering`)                                                       |
| `subfolder` | *(optional)* Subfolder name within the module (e.g., `notifications`). Omit for a top-level module |

## Modes

1. **New subfolder in existing module** — when `subfolder` is provided and `modules/{module}/` already exists. Creates a new subfolder under the existing module.
2. **New top-level module** — when `subfolder` is omitted. Creates a new module at `modules/{module}/`.

## Naming derivation

All names are mechanically derived from `module` (and `subfolder` when present). **PascalCase** means split on `-`, capitalize each segment’s first letter, join (e.g., `landing-page` → `LandingPage`).

### Top-level module (no subfolder)

| Name              | Formula                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Package name      | `@modules/{module}`                                                           |
| Directory         | `modules/{module}/`                                                           |
| Register function | `register` + PascalCase(module)                                               |
| Page component    | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`) |
| Register file     | `src/{registerFunction}.tsx`                                                  |
| Page file         | `src/{PageComponent}.tsx`                                                     |
| `$id`             | `{module}`                                                                    |
| Registry key      | `{module}`                                                                    |
| Route path        | `/{module}`                                                                   |
| Nav label         | PascalCase(module) with spaces between words                                  |
| Dev script        | `dev-{module}`                                                                |

### Subfolder within existing module

| Name              | Formula                                                                             |
| ----------------- | ----------------------------------------------------------------------------------- |
| Directory         | `modules/{module}/{subfolder}/`                                                     |
| Register function | `register` + PascalCase(module) + PascalCase(subfolder)                             |
| Page component    | PascalCase(subfolder) + `Page` (skip `Page` if subfolder already ends with `-page`) |
| Register file     | `src/{registerFunction}.tsx`                                                        |
| Page file         | `src/{PageComponent}.tsx`                                                           |
| `$id`             | `{module}-{subfolder}`                                                              |
| Registry key      | `{module}/{subfolder}`                                                              |
| Route path        | `/{module}/{subfolder}`                                                             |
| Nav label         | PascalCase(subfolder) with spaces between words                                     |
| Dev script        | `dev-{module}-{subfolder}`                                                          |

Subfolder modules share the parent module’s package name (`@modules/{module}`) — they do NOT get their own package.json.

## Reference module

`modules/management/` is the canonical reference. Before creating any file, read the reference files: `package.json`, `tsconfig.json`, `src/index.ts`, and a register/page file pair from an existing subfolder (e.g., `inventory/` or `account/`).

Reproduce the same file skeleton with substituted names. Copy dependency versions and scripts exactly — never hardcode versions from memory.

## Process

### 1. Validate

**Top-level module:**
- Confirm `modules/{module}/` does NOT exist. If it does, stop.

**Subfolder:**
- Confirm `modules/{module}/` exists. If not, ask the user whether to create a top-level module first.
- Confirm `modules/{module}/{subfolder}/` does NOT exist. If it does, stop.

### 2. Create module files

**Top-level module** — create these files under `modules/{module}/`:

| File                         | Substitutions                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `package.json`               | Name, description. `license`: `"Apache-2.0"`, `author`: `"Patrick Lafrance"`. Copy `workspace:*` deps only. |
| `tsconfig.json`              | Identical copy.                                                                                             |
| `src/index.ts`               | Barrel export of the register function.                                                                     |
| `src/{registerFunction}.tsx` | Register function name, route path, `$id`, nav label, page component import.                                |
| `src/{PageComponent}.tsx`    | Component name.                                                                                             |

**Subfolder** — create only these files under `modules/{module}/{subfolder}/`:

| File                         | Substitutions                                                                |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `src/{registerFunction}.tsx` | Register function name, route path, `$id`, nav label, page component import. |
| `src/{PageComponent}.tsx`    | Component name.                                                              |

Then update `modules/{module}/src/index.ts` to add a barrel export for the new subfolder’s register function.

### 3. Register in host

Add three things so the host app can load the module at runtime:

1. **`apps/host/src/getActiveModules.tsx`** — add import and `ModuleRegistry` entry.

<host-registration>
import { {registerFunction} } from "{packageName}";

// Inside ModuleRegistry:
"{registryKey}": { register: {registerFunction} }
</host-registration>

`getActiveModules` reads the `MODULES` env var to filter which modules to load. The dev script (step 7) sets this variable so the new module can be run in isolation.

2. **`apps/host/package.json`** — add `"{packageName}": "workspace:*"` to dependencies (skip if the parent module package is already listed).
3. **`apps/host/src/styles/globals.css`** — add `@source` directive for the new module path.

### 4. Update module storybook

In `apps/{module}-storybook/.storybook/`:

1. `storybook.css` — add `@source` for the new subfolder/module source files.
2. `main.ts` — add the story glob for the new subfolder/module.

If the module storybook doesn’t exist yet, skip and warn.

### 5. Update unified storybook

In `apps/unified-storybook/.storybook/`:

1. `main.ts` — add story glob under the `// {ModuleTitle}` comment section.
2. `storybook.css` — add `@source` directive for the module source files.

### 6. Update affected map

In `scripts/get-affected-storybooks.ts`, add the package name `@modules/{module}` to the `StorybookDependencies` entry for `@apps/{module}-storybook`.

Only list module package names (`@modules/*`) — never shared packages.

### 7. Add dev script

In root `package.json`, add:

**Top-level module:**
```
"dev-{module}": "cross-env MODULES={module} pnpm dev-host"
```

**Subfolder:**
```
"dev-{module}-{subfolder}": "cross-env MODULES={module}/{subfolder} pnpm dev-host"
```

### 8. Install and verify

1. Run `pnpm install`.
2. Run `pnpm lint` — fix any issues.
3. Run `_validate-modules` on the new module path. Fix any issues — the reviewer will run the same checks.
