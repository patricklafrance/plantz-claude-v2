---
name: _scaffold-domain
description: Scaffold a new domain with its first module and domain storybook.
license: MIT
---

# Scaffold Domain

Create a new domain directory, its first module, and its domain storybook.

## Inputs

| Input         | Description                  |
| ------------- | ---------------------------- |
| `domain`      | Domain name                  |
| `module`      | First module name            |
| `description` | One-line domain mental model |

## Reference domain

`apps/management/` is the canonical reference. Read `apps/management/CLAUDE.md` before creating the new domain's CLAUDE.md.

## Process

### 1. Validate

- Confirm `apps/{domain}/` does NOT exist. If it does, stop.

### 2. Create domain directory

Create `apps/{domain}/`.

### 3. Create CLAUDE.md

Write `apps/{domain}/CLAUDE.md` following the structure of the reference domain's CLAUDE.md. Adapt:

- Domain title and description
- Story title prefix: `{PascalCase(domain)}/`
- Storybook dev command: `pnpm dev-{domain}-storybook`
- Data layer section: leave generic until modules are added
- API surface: `/api/{domain}/`

### 4. Update placement.md

Add the new domain to the Domains table in `agent-docs/references/placement.md`.

### 5. Scaffold first module

Run the `_scaffold-domain-module` skill with the `domain` and `module` inputs.

### 6. Scaffold domain storybook

Run the `_scaffold-domain-storybook` skill with the `domain` input.
