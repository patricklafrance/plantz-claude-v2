---
name: validate-modules
description: Validate that Squide local modules conform to the expected structure and wiring.
license: MIT
---

# Validate Modules

Read-only validation. Verify that modules are correctly structured and wired into the host, storybooks, and CI.

## Inputs

| Input              | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `affected-modules` | Module paths to validate (e.g., `apps/{domain}/{module}/`) |

## Naming derivation

Derived from the module path `apps/{domain}/{module}/`. **PascalCase** means split on `-`, capitalize each segment's first letter, join.

| Name              | Formula                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Package name      | `@modules/{domain}-{module}`                                                  |
| Register function | `register` + PascalCase(domain) + PascalCase(module)                          |
| Page component    | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`) |
| Registry key      | `{domain}/{module}`                                                           |
| `$id`             | `{domain}-{module}`                                                           |
| Dev script        | `dev-{domain}-{module}`                                                       |

## Process

### 1. Run all checks for each module

- **File structure** — These 5 files exist: `package.json`, `tsconfig.json`, `src/index.ts`, `src/{registerFunction}.tsx`, `src/{PageComponent}.tsx`.
- **Package.json** — `name` matches derived name, `license` is `"Apache-2.0"`, `author` is `"Patrick Lafrance"`, `exports` is `"./src/index.ts"`.
- **Barrel export** — `src/index.ts` exports the register function.
- **Host registration** — `apps/host/src/getActiveModules.tsx` imports the register function and has the registry key in `ModuleRegistry`. `apps/host/package.json` lists the package in dependencies.
- **Host CSS** — `apps/host/src/styles/globals.css` has a `@source` directive for the module.
- **Domain storybook** — `apps/{domain}/storybook/.storybook/main.ts` has a story glob and `storybook.css` has a `@source` directive. Skip if domain storybook doesn't exist.
- **Unified storybook** — `apps/storybook/.storybook/main.ts` has a story glob and `storybook.css` has a `@source` directive.
- **Affected detection** — `scripts/getAffectedStorybooks.ts` includes the package name in the domain's `StorybookDependencies` entry.
- **Dev script** — Root `package.json` has `"dev-{domain}-{module}"`.
- **Tsconfig** — Extends `"@workleap/typescript-configs/library.json"`.

### 2. Report

Output a checklist per module. `[x]` for passing, `[ ]` for failures with a one-line description of what's wrong.
