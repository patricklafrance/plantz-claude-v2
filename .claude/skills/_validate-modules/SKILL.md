---
name: _validate-modules
description: Validate that Squide local modules conform to the expected structure and wiring.
license: MIT
---

# Validate Modules

Read-only validation. Verify that modules are correctly structured and wired into the host, storybooks, and CI.

## Inputs

| Input              | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `affected-modules` | Module paths to validate (e.g., `modules/{module}/{subfolder}/`)  |

## Naming derivation

Derived from the module path. **PascalCase** means split on `-`, capitalize each segment's first letter, join.

### Top-level module (`modules/{module}/`)

| Name              | Formula                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Package name      | `@modules/{module}`                                                           |
| Register function | `register` + PascalCase(module)                                               |
| Page component    | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`) |
| Registry key      | `{module}`                                                                    |
| `$id`             | `{module}`                                                                    |
| Dev script        | `dev-{module}`                                                                |

### Subfolder (`modules/{module}/{subfolder}/`)

| Name              | Formula                                                                             |
| ----------------- | ----------------------------------------------------------------------------------- |
| Package name      | `@modules/{module}` (shared with parent)                                            |
| Register function | `register` + PascalCase(module) + PascalCase(subfolder)                             |
| Page component    | PascalCase(subfolder) + `Page` (skip `Page` if subfolder already ends with `-page`) |
| Registry key      | `{module}/{subfolder}`                                                              |
| `$id`             | `{module}-{subfolder}`                                                              |
| Dev script        | `dev-{module}-{subfolder}`                                                          |

## Process

### 1. Run all checks for each module

- **File structure** — Top-level module: `package.json`, `tsconfig.json`, `src/index.ts`, `src/{registerFunction}.tsx`, `src/{PageComponent}.tsx` exist. Subfolder: `src/{registerFunction}.tsx`, `src/{PageComponent}.tsx` exist.
- **Package.json** (top-level only) — `name` matches derived name, `license` is `"Apache-2.0"`, `author` is `"Patrick Lafrance"`, `exports` is `"./src/index.ts"`.
- **Barrel export** — `modules/{module}/src/index.ts` exports the register function.
- **Register function $id** — If `src/{registerFunction}.tsx` calls `registerNavigationItem`, the `$id` value matches the derived `$id`. Skip if no nav item is registered.
- **Host registration** — `apps/host/src/getActiveModules.tsx` imports the register function and has the registry key in `ModuleRegistry`. `apps/host/package.json` lists the package in dependencies.
- **Host CSS** — `apps/host/src/styles/globals.css` has a `@source` directive for the module.
- **Module storybook** — `apps/{module}-storybook/.storybook/main.ts` has a story glob and `storybook.css` has a `@source` directive. Skip if module storybook doesn't exist.
- **Unified storybook** — `apps/unified-storybook/.storybook/main.ts` has a story glob and `storybook.css` has a `@source` directive.
- **Affected detection** — `scripts/get-affected-storybooks.ts` includes the package name in the module's `StorybookDependencies` entry.
- **Dev script** — Root `package.json` has the derived dev script name.
- **Tsconfig** — Extends `"@workleap/typescript-configs/library.json"`.

### 2. Report

Output a checklist per module. `[x]` for passing, `[ ]` for failures with a one-line description of what's wrong.
