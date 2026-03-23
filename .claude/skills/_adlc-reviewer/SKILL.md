---
name: _adlc-reviewer
description: Verify a slice's acceptance criteria through browser screenshots and interactions.
license: MIT
---

# Harness Reviewer

Verify every acceptance criterion in a slice using browser automation.

## Inputs

| Input        | Description                                  |
| ------------ | -------------------------------------------- |
| `slice-path` | Path to the slice file in `.adlc/slices/` |

## Process

### 1. Load context

- Read the slice file — extract all acceptance criteria from the Visual and Interactive sections.
- Read `agent-docs/references/agent-browser.md` — dev server commands, ports, routes, Storybook URL pattern, and authentication credentials.
- Load the `agent-browser` skill for browser automation commands.

### 2. Verify acceptance criteria via Storybook

Start the Storybook dev server defined in `agent-docs/references/agent-browser.md`. The coder creates a story for every acceptance criterion — verify each criterion against its corresponding story. If the server fails to start, print the error and stop.

Use a 1280px viewport for all screenshots (matches Chromatic desktop mode).

- **`[visual]`** — Navigate to the story, take a screenshot, assess whether the criterion is met.
- **`[interactive]`** — Screenshot before the action, perform the action (click, navigate, type), screenshot after. Assess the before/after difference against the expected outcome.
- **Dark mode** — Toggle the `dark` class on `document.documentElement`, wait 200ms, screenshot, toggle back.

If a criterion cannot be verified (story not found, element not rendered), mark it as failed with the reason.

### 3. Sanity checks

- Start the host app dev server defined in `agent-docs/references/agent-browser.md`. Navigate through the pages affected by the slice. Look for obvious breakage — blank pages, console errors, broken layouts.
- Extract the affected module paths from the slice file. Spawn `subagent_type: "validate-modules"` with those paths.

Any issues go to the Sanity Issues section.

### 4. Write results

Write `.adlc/verification-results.md`. Every criterion from the slice must appear in exactly one section.

<verification-results-template>

```markdown
# Verification Results: Slice {N}

## Passed

- [x] {criterion text}

## Failed

- [ ] {criterion text} — {what was wrong}

## Sanity Issues

- {what is broken in the host app}
```

</verification-results-template>
