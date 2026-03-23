---
name: _scaffold-domain-storybook
description: Scaffold a domain-scoped Storybook.
license: MIT
---

# Scaffold Domain Storybook

Create a domain-scoped Storybook application.

## Inputs

| Input    | Description                    |
| -------- | ------------------------------ |
| `domain` | Domain directory under `apps/` |

## Naming derivation

| Name              | Formula                                  |
| ----------------- | ---------------------------------------- |
| Storybook path    | `apps/{domain}/storybook/`               |
| Package name      | `@apps/{domain}-storybook`               |
| Dev script        | `dev-{domain}-storybook`                 |
| Chromatic token   | `{DOMAIN_UPPER}_CHROMATIC_PROJECT_TOKEN` |
| Chromatic step id | `chromatic-{domain}`                     |
| Domain title      | Capitalize first letter of `{domain}`    |

Module-level values are discovered at runtime:

| Value                 | How                                                       |
| --------------------- | --------------------------------------------------------- |
| Module directories    | `ls apps/{domain}/` minus `storybook/`                    |
| Module package names  | Read each module's `package.json` → `name` field          |
| Story globs (domain)  | `../../{module}/src/**/*.stories.tsx` per module          |
| Story globs (unified) | `../../{domain}/{module}/src/**/*.stories.tsx` per module |

## Reference storybook

`apps/management/storybook/` is the canonical reference. Before creating any file, read all 9 files:

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

- Confirm `apps/{domain}/` exists. If not, ask the user.
- Confirm `apps/{domain}/storybook/` does NOT exist. If it does, stop.
- Scan `apps/{domain}/` for module directories (everything except `storybook/`).
- Read each module's `package.json` to get its package name.

### 2. Create storybook files

Create 9 files under `apps/{domain}/storybook/`. Clone each from the reference.

**Files with substitutions:**

| File                       | Changes                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`             | `name` and `description` only. Copy everything else verbatim.                                                                       |
| `.storybook/main.ts`       | Replace `stories` array with one glob per discovered module.                                                                        |
| `.storybook/storybook.css` | Replace module-specific `@source` lines with one per discovered module. Keep the `@import` and `@packages/components` source as-is. |
| `chromatic.config.json`    | `storybookBaseDir` → `apps/{domain}/storybook`. Remove `projectId` — the user sets it after creating the Chromatic project.         |
| `vitest.config.ts`         | `test.name` → `{domain}-storybook`.                                                                                                 |

**Files cloned without changes:** `preview.tsx`, `vitest.setup.ts`, `tsconfig.json`, `vite.config.ts`.

### 3. Add dev script

In root `package.json`, add:

```
"dev-{domain}-storybook": "turbo run dev --filter=@apps/{domain}-storybook"
```

### 4. Update unified storybook

In `apps/storybook/.storybook/`:

1. `main.ts` — add story globs under a `// {DomainTitle}` comment section.
2. `storybook.css` — add `@source` directives for each module.

### 5. Update affected map

In `scripts/getAffectedStorybooks.ts`, add a new `StorybookDependencies` entry:

```ts
"@apps/{domain}-storybook": [
    "{module_package_name_1}",
    "{module_package_name_2}"
]
```

Only list module package names (`@modules/*`) — never shared packages.

### 6. Add Chromatic CI step

In `.github/workflows/chromatic.yml`, add a step after the last domain step but before "Chromatic - Packages":

```yaml
- name: Chromatic - {DomainTitle}
  id: chromatic-{domain}
  uses: chromaui/action@latest
  with:
      projectToken: ${{ secrets.{DOMAIN_UPPER}_CHROMATIC_PROJECT_TOKEN }}
      workingDir: apps/{domain}/storybook
      onlyChanged: true
      exitOnceUploaded: true
      autoAcceptChanges: main
      skip: ${{ steps.affected-storybooks.outputs['@apps/{domain}-storybook'] == 'false' }}
      debug: true
```

### 7. Install and verify

1. Run `pnpm install`.
2. Run `pnpm lint` — fix any issues.
