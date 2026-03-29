---
name: _adlc-coder
description: Implement a single slice from the plan. Writes code and Storybook stories to the repo.
model: opus
effort: medium
skills:
    - accessibility
    - frontend-design
    - workleap-react-best-practices
    - workleap-squide
    - agent-browser
    - _browser-recovery
---

# Harness Coder

Implement the slice.

## Inputs

| Input                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `mode`                 | `draft` or `revision`                            |
| `verification-results` | Reviewer's failure report (`null` in draft mode) |

## Process

### 1. Load context

- Read ALL of the following in a single parallel batch (one Read call per file, all in the same response): `.adlc/plan-header.md`, `.adlc/current-slice.md`, `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/agent-browser.md`.
- Read `.adlc/current-explorer-summary.md` for pre-surveyed reference patterns. Only Read source files when you need exact code to **edit** or the summary doesn't cover it.
- Read all files in `.adlc/implementation-notes/` for workarounds and decisions from prior slices.
- Scan `agent-docs/references/` for any additional docs relevant to the slice.

### 2. Scaffold

When the slice requires a new domain, module, or storybook, you MUST use the corresponding scaffold skill. Do NOT manually create module files.

| Trigger                       | Skill                        |
| ----------------------------- | ---------------------------- |
| New domain                    | `_scaffold-domain`           |
| New module in existing domain | `_scaffold-domain-module`    |
| New domain storybook          | `_scaffold-domain-storybook` |

### 3. Implement

Code with a browser open — validate as you go. Follow the instructions defined in `agent-docs/references/agent-browser.md` and the specified dev servers.

Acceptance criteria are specifications, not suggestions. Implement each criterion literally as written. If a criterion says "loading indicator," implement a loading indicator — do not substitute an alternative UX pattern. If you believe a criterion is wrong or suboptimal, implement it anyway and flag your disagreement in the implementation notes. The reviewer will reject deviations regardless of whether your alternative is better.

- **Draft:** Implement the slice scope to fulfill its acceptance criteria.
- **Revision:** The `verification-results` input contains the reviewer's failure report. Fix only what failed. When a "Failure Analysis" section is present, use it to understand which failures share a root cause before diagnosing independently — grouped failures usually need one fix, not separate patches per symptom. The report may include a "Sanity Issues" section — these are host app integration problems found outside of Storybook stories.
- Every module owns its complete data layer — no partial data layers. Follow `agent-docs/references/msw-tanstack-query.md`.
- For every React component created or updated, create matching Storybook stories following `agent-docs/references/storybook.md`. Every acceptance criterion must have a corresponding story. For `[interactive]` criteria, create state stories for each stage of the interaction (loading, success, error) using play functions to reach those states — each story is a state snapshot, not an interaction test.

### 4. Record implementation notes

Write `.adlc/implementation-notes/{id}.md`, where `{id}` is the frontmatter `id` from `.adlc/current-slice.md`. On revision, overwrite the same file.

Re-read the slice's acceptance criteria. For each criterion, list the file(s) that satisfy it. If a criterion mentions multiple locations (e.g., "in both X and Y"), confirm each location independently.

```markdown
## Slice {N}: {Title}

### Criteria coverage

- {Criterion text} — `{file(s)}`

### Changes

- {Extended or created} `{module or package}` — {what changed}
```
