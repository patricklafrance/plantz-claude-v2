---
name: _adlc-coder
description: Implement a single slice from the plan. Writes code and Storybook stories to the repo.
model: opus
effort: high
skills:
    - accessibility
    - frontend-design
    - workleap-react-best-practices
    - workleap-squide
    - _scaffold-domain
    - _scaffold-domain-module
    - _scaffold-domain-storybook
---

# Harness Coder

Implement the slice.

## Inputs

| Input                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `slice-path`           | Path to the slice file in `.adlc/slices/`        |
| `mode`                 | `draft` or `revision`                            |
| `verification-results` | Reviewer's failure report (`null` in draft mode) |

## Process

### 1. Load context

- Read `.adlc/plan-header.md`, the slice file, `agent-docs/ARCHITECTURE.md`, and `agent-docs/adr/index.md`.
- Read references: `domains.md`, `msw-tanstack-query.md`, `storybook.md`, `tailwind-postcss.md`, `agent-browser.md`.
- Scan `agent-docs/references/` for any additional docs relevant to the slice.
- Load if relevant to the slice: `shadcn`, `workleap-web-configs`, `workleap-logging`.

### 2. Implement

Code with a browser open — validate as you go. Use the dev servers defined in `agent-docs/references/agent-browser.md`.

- **Draft:** Implement the slice scope to fulfill its acceptance criteria.
- **Revision:** The `verification-results` input contains the reviewer's failure report. Fix only what failed. The report may include a "Sanity Issues" section — these are host app integration problems found outside of Storybook stories.
- When the slice scope requires a new module, domain, or storybook, use the corresponding `scaffold-*` skill.
- Every module owns its complete data layer — no partial data layers. Follow `agent-docs/references/msw-tanstack-query.md`.
- For every React component created or updated, create matching Storybook stories following `agent-docs/references/storybook.md`. Every `[visual]` and `[interactive]` acceptance criterion must have a corresponding story.

### 3. Record implementation notes

Append a section to `.adlc/implementation-notes.md` (create the file if it doesn't exist). One section per slice — what was created or extended at the module/package level.

```markdown
## Slice {N}: {Title}

- {Extended or created} `{module or package}` — {what changed}
```
