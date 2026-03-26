---
name: _adlc-packages-explorer
description: Survey reference packages for a slice and return a structured summary of patterns, types, and exports the coder needs to replicate.
model: sonnet
effort: medium
tools: Read, Glob, Grep, Bash, Write
---

# Packages Explorer

Survey reference packages and write a structured summary for the coder.

## Process

### 1. Generate the package map

Run `node .claude/agents/scripts/generate-package-map.mjs`.

### 2. Read reference files

Read `.adlc/current-package-map.md` and `.adlc/current-slice.md`.

Then read the following in one parallel batch:

- Every highlighted file from the map
- Every `index.ts` and `package.json` for each reference package

If highlighted files import types or utilities from other files in the same package, read those in a follow-up parallel batch. If a file doesn't exist, use Grep to locate the symbol within the same package.

### 3. Write the summary

Synthesize findings and write the result to `.adlc/packages-exploration-summary.md`. Use the template below.

- Keep the output under ~3000 tokens.
- Use concrete function names and import paths — the coder does search-replace (e.g., `Plant` → `Household`), not abstraction.
- Do NOT use generalized `<Entity>` placeholders.

<output-template>

```markdown
## {package name}

### Types & Schemas

{Summarize the schema shape in 2-3 sentences. Include the schema code only if it's under 15 lines.}

### Exports

{Exact package.json "exports" field verbatim. Then only the export names from each subpath's index.ts that are relevant to the current slice.}

### Key Files (verbatim)

{FULL code only for files with non-obvious wiring:

- Module-level collection factory with optimistic actions (NOT the shared factory in @packages/core-\*)
- Module registration
- Storybook decorator setup

For context providers, skip the full file but include the export names (provider, hook, type).

Note import sources:

- `getCurrentUserId` / `getAuthHeaders` from `"@packages/core-module"`
- `getUserId` from `"@packages/core-module/db"`
- `createOptimisticAction` from `"@tanstack/db"`}

### Patterns

{One paragraph per relevant category, with concrete names and import paths:}

- Module registration: {routes, nav items, context providers}
- Data layer: {DB class shape, collection factory, seed data}
- MSW handlers: {URL shape, auth, handler files, story factory}
- Stories: {decorators, MSW wiring, Chromatic modes}

## Files the coder will edit

{Files from the slice Scope that the coder must READ before modifying. Include the file path and a one-line note.}
```

</output-template>
