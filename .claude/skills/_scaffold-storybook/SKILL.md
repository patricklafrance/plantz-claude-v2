---
name: _scaffold-storybook
description: Scaffold a module-scoped Storybook.
license: MIT
---

# Scaffold Storybook

Create a module-scoped Storybook application.

## Inputs

| Input    | Description                                      |
| -------- | ------------------------------------------------ |
| `module` | Module name (e.g., `management`, `watering`)     |

## Naming derivation

| Name              | Formula                                    |
| ----------------- | ------------------------------------------ |
| Storybook path    | `apps/{module}-storybook/`                 |
| Package name      | `@apps/{module}-storybook`                 |
| Dev script        | `dev-{module}-storybook`                   |
| Chromatic token   | `{MODULE_UPPER}_CHROMATIC_PROJECT_TOKEN`   |
| Chromatic step id | `chromatic-{module}`                       |
| Module title      | Capitalize first letter of `{module}`      |

Module-level values are discovered at runtime:

| Value                  | How                                                            |
| ---------------------- | -------------------------------------------------------------- |
| Module subfolders      | `ls modules/{module}/` (directories only)                      |
| Module package name    | Read `modules/{module}/package.json` → `name` field           |
| Story globs (module)   | `../../modules/{module}/**/src/**/*.stories.tsx`               |
| Story globs (unified)  | `../../modules/{module}/**/src/**/*.stories.tsx`               |

## Reference storybook

`apps/storybook-management/` is the canonical reference. Before creating any file, read all 9 files:

1. `package.json`
2. `.storybook/main.ts`
3. `.storybook/preview.tsx`
4. `.storybook/storybook.css`
5. `.storybook/vitest.setup.ts`
6. `chromatic.config.json`
7. `tsconfig.json`
8. `vite.config.ts`
9. `vitest.config.ts`

Copy dependency versions and config values exactly — never hardcode from memory.

## Process

### 1. Validate

- Confirm `modules/{module}/` exists. If not, ask the user.
- Confirm `apps/storybook-{module}/` does NOT exist. If it does, stop.
- Scan `modules/{module}/` for subfolders.
- Read `modules/{module}/package.json` to get its package name.

### 2. Create storybook files

Create 9 files under `apps/storybook-{module}/`. Clone each from the reference.

**Files with substitutions:**

| File                       | Changes                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`             | `name` and `description` only. Copy everything else verbatim.                                                                       |
| `.storybook/main.ts`       | Replace `stories` array with globs covering the module’s subfolders.                                                                |
| `.storybook/storybook.css` | Replace module-specific `@source` lines with ones covering the module’s source. Keep the `@import` and `@packages/components` source as-is. |
| `chromatic.config.json`    | `storybookBaseDir` → `apps/storybook-{module}`. Remove `projectId` — the user sets it after creating the Chromatic project.         |
| `vitest.config.ts`         | `test.name` → `storybook-{module}`.                                                                                                |

**Files cloned without changes:** `preview.tsx`, `vitest.setup.ts`, `tsconfig.json`, `vite.config.ts`.

### 3. Add dev script

In root `package.json`, add:

```
"dev-storybook-{module}": "turbo run dev --filter=@apps/storybook-{module}"
```

### 4. Update unified storybook

In `apps/storybook/.storybook/`:

1. `main.ts` — add story globs under a `// {ModuleTitle}` comment section.
2. `storybook.css` — add `@source` directives for the module’s source files.

### 5. Update affected map

In `scripts/get-affected-storybooks.ts`, add a new `StorybookDependencies` entry:

```ts
"@apps/{module}-storybook": [
    "@modules/{module}"
]
```

Only list module package names (`@modules/*`) — never shared packages.

### 6. Add Chromatic CI step

In `.github/workflows/chromatic.yml`, add a step after the last module step but before "Chromatic - Packages":

```yaml
- name: Chromatic - {ModuleTitle}
  id: chromatic-{module}
  uses: chromaui/action@latest
  with:
      projectToken: ${{ secrets.{MODULE_UPPER}_CHROMATIC_PROJECT_TOKEN }}
      workingDir: apps/{module}-storybook
      onlyChanged: true
      exitOnceUploaded: true
      autoAcceptChanges: main
      skip: ${{ steps.affected-storybooks.outputs['@apps/{module}-storybook'] == 'false' }}
      debug: true
```

### 7. Update knip config

In root `knip.json`, add a workspace entry for the new storybook:

<knip-entry>
"apps/{module}-storybook": {
    "ignoreDependencies": ["@packages/components", "@packages/core-plants", "launchdarkly-js-client-sdk"]
}
</knip-entry>

Copy the `ignoreDependencies` list from an existing module storybook — it changes when shared packages are added.

### 8. Install and verify

1. Run `pnpm install`.
2. Run `pnpm lint` — fix any issues.
