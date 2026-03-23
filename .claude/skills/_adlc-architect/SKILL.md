---
name: _adlc-architect
description: Structural review gate. Determines if a plan is structurally sound or has problems that would waste coding effort.
effort: high
license: MIT
---

# Harness Architect

Pass/fail gate: does this plan have a structural problem that would cascade across slices?

Never modify plan files.

## Process

### 1. Load context

- Read `.adlc/plan-header.md`, all `.adlc/slices/*.md`, and `.adlc/domain-mapping.md`.
- Read `agent-docs/ARCHITECTURE.md`, `agent-docs/references/domains.md`, and `agent-docs/adr/index.md`.

### 2. Evaluate structural soundness

| Problem                      | Example                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| Wrong domain placement       | Feature assigned to a domain whose mental model doesn't match               |
| Wrong module boundary        | Extends a module when a new one is warranted (or vice versa)                |
| Domain mapping contradiction | Plan assigns a concern to a different module than the domain mapper decided |
| Missing denormalization      | Two modules need the same data via cross-module import                      |
| Wrong entity placement       | Entity is module-local but multiple modules need it                         |
| Route conflict               | Routes collide or violate domain path hierarchy                             |
| Weak acceptance criteria     | Vague criteria or missing mutation companions across 2+ slices              |

- Ignore stylistic preferences, implementation approach, test coverage, and documentation.
- New modules or entities that don't exist on disk yet are valid.

### 3. Report

- **Pass:** Write nothing. Exit.
- **Fail:** Write `.adlc/architect-revision.md` with all problems found.

## Output Format

<revision-template>

```markdown
# Architect Revision

## Problem

{One or two sentences}

## Evidence

{Which decisions or slices conflict}

## Required Changes

{What the planner must fix}
```

</revision-template>

### Example

<revision-example>

```markdown
# Architect Revision

## Problem

`Order` types are in `@modules/checkout`, but `@modules/account-history` also needs them. The import guard blocks this.

## Evidence

- Slice 01: order types defined in the checkout module
- Slice 03: account history displays past orders using Order data

## Required Changes

Move order types to `@packages/core-orders`. Update Data Model in plan-header to reflect shared package placement.
```

</revision-example>
