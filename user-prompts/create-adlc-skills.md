> **OUTDATED:** The "self-contained references" approach described below was replaced. Tech-stack references now live in `agent-docs/references/` as a single source of truth. ADLC skills read them via explicit paths, not local copies. See the current SKILL.md files for the actual pattern.

# Create ADLC Agent Skills

Create a collection of agent skills that map the Agent Development Life Cycle (ADLC). These skills will be used by an orchestrator agent and specialized subagents to develop a feature end-to-end.

All agent skills must be created using the `skill-creator` agent skill with 2 subagents to assist and challenge each other.

## Skills to create

| Skill                      | Purpose                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `plantz-adlc-orchestrator` | Entry point. Leads the feature development, spawns subagents, coordinates steps sequentially. |
| `plantz-adlc-plan`         | Drafts the technical plan and outputs it to a file.                                           |
| `plantz-adlc-code`         | Implements the plan or fixes issues, outputs a changes summary file.                          |
| `plantz-adlc-test`         | Validates code quality — lint, module structure, quality gates, smoke tests.                  |
| `plantz-adlc-document`     | Audits and fixes drift in agent-docs and CLAUDE.md after implementation.                      |
| `plantz-adlc-merge`        | Commits, pushes, opens a PR, and monitors CI.                                                 |

---

## Shared tech-stack constraints

> **IMPORTANT — self-contained skills.** The constraints below apply to `plantz-adlc-plan`, `plantz-adlc-code`, and `plantz-adlc-test`. Each skill must embed the tech-stack content in its own `references/` subfiles so it is fully self-contained at runtime — subagents are stateless and should never need to read another skill's files. The skill-creator writes the content once (in `plantz-adlc-plan`) then copies the reference files to `plantz-adlc-code` and `plantz-adlc-test`. Each copied reference file must include a comment at the top: `<!-- Canonical source: plantz-adlc-plan. Keep in sync with plantz-adlc-code, plantz-adlc-test. -->`.

### One-time migration tasks for skill-creator

> **These instructions are for the skill-creator only — do NOT embed any of the following in the generated skill files.** These are one-time setup actions that happen when the skills are first created.

> The following `agent-docs/references/` files contain content that belongs in these ADLC skills: `color-mode.md`, `responsive-layout.md`, `tanstack-db.md`, `storybook.md`, `shadcn.md`, `quality-gates.md`, `tailwind-postcss.md`. Absorb their content into the skill's own `references/` subfiles (the skill-creator decides the file structure — one file per topic, merged files, whatever makes sense). After absorbing each file:
>
> 1. Delete the original from `agent-docs/references/`.
> 2. Remove its entry from the root `CLAUDE.md` index.
> 3. Update nested `CLAUDE.md` files that reference the deleted file — replace the reference with "load the `plantz-adlc-code` skill for [topic] conventions." Known files to update:
>     - `packages/components/CLAUDE.md` — references `storybook.md`, `shadcn.md`
>     - `apps/management/CLAUDE.md` — references `storybook.md`
>     - `apps/today/CLAUDE.md` — references `storybook.md`

### Pre-read requirements

Before doing any work, the agent must read:

- `agent-docs/ARCHITECTURE.md`
- `agent-docs/adr/index.md` — look for relevant architectural decisions
- `agent-docs/odr/index.md` — look for relevant operational decisions

### Technology rules

> **Migration note for skill-creator (one-time, do NOT embed in runtime skills):** Each bullet below says "absorb from `agent-docs/references/X.md`." This is a one-time instruction — read that file's content, embed it in the skill's reference files, then delete the source. At runtime, the skill's own files ARE the source of truth. The "absorb from" instructions must NOT appear in the generated skill files.

- **React + TypeScript** — load the `workleap-react-best-practices` skill.
- **Tailwind CSS** — utility-first styling. Absorb the cross-package class scanning rules from `agent-docs/references/tailwind-postcss.md`.
- **WCAG AA** — load the `accessibility` skill. Absorb the accessibility minimums and definition of done from `agent-docs/references/quality-gates.md`.
- **Color mode** — light, dark, and system. Absorb the class-based dark mode rules, theme tokens, and verification checklist from `agent-docs/references/color-mode.md`.
- **Responsive layout** — phone, tablet, desktop. Absorb the Tailwind breakpoints, mobile-first rules, and verification from `agent-docs/references/responsive-layout.md`.
- **TanStack DB** — localStorage collections only. Absorb the CRUD patterns, date coercion, and collection setup from `agent-docs/references/tanstack-db.md`.
- **shadcn/ui v4 + Base UI** — absorb the CLI bugs and Tailwind v4 source detection from `agent-docs/references/shadcn.md`. Load the `shadcn` skill.
- **Storybook** — CSF3 stories with full variant coverage. Absorb the conventions and Chromatic compatibility rules from `agent-docs/references/storybook.md`.
- **Design** — load the `frontend-design` skill for any UI work.

### Scaffolding

- To scaffold a new domain module, load and use the `plantz-scaffold-domain-module` skill.
- To scaffold a new domain Storybook, load and use the `plantz-scaffold-domain-storybook` skill.

---

## Subagent protocol

Every skill that says "spawn two subagents" must follow this protocol:

1. **Subagent A** (drafter): produces the initial output (plan, test report, doc update — or writes code to the repo).
2. **Subagent B** (reviewer): reviews Subagent A's output and either applies mechanical fixes directly, or reports non-trivial concerns in the skill's primary output file (e.g., a "Reviewer concerns" section appended to `plan.md` or `changes-[iteration].md`).

**Who spawns whom:** The **orchestrator** spawns both subagents directly. The orchestrator tells Subagent A "you are the drafter" and Subagent B "you are the reviewer." The skill's "Subagent pattern" section describes the roles — it does NOT mean the skill spawns its own subagents. There is only one level of subagent nesting: orchestrator → subagent. Subagents never spawn further subagents.

Only one subagent writes to the repo or output file at a time — never two concurrently. If they fundamentally disagree, the orchestrator reads the output file (which includes the reviewer's appended concerns) and decides how to proceed.

**For the code skill specifically:** Subagent A implements the full change set. Subagent B reviews the changed files (listed in `changes-[iteration].md`) and applies mechanical fixes directly. For design/architecture concerns, B appends a "## Reviewer concerns" section to `changes-[iteration].md` — the orchestrator reads it and decides whether to address them in the current iteration or defer to the test-fix loop.

**Subagent lifecycle:** Claude Code subagents are stateless. Each spawned subagent starts fresh. Context is passed between iterations via files in `./tmp/runs/[run-uuid]/`. Never refer to "existing subagents" — always spawn new subagents with the relevant file paths.

---

## Failure handling

Every orchestrator step must include this fallback: if a subagent fails to produce its expected output file, or if a command fails unexpectedly, the orchestrator must **stop the run** and report the failure and step number to the user. Do **not** clean up the `./tmp/runs/[run-uuid]/` folder on failure — preserve artifacts so the user can debug. Only clean up on successful completion (step 9). Do not retry blindly — surface the error.

---

## plantz-adlc-orchestrator

Entry point for developing a new feature. Leads the process, spawns subagents, and coordinates their work sequentially.

### Steps (execute in order — each step must complete before the next begins)

1. **Generate run UUID and create run folder.**
   Run: `node -e "console.log(require('crypto').randomUUID())"` to generate the UUID.
   Create the folder: `mkdir -p ./tmp/runs/[run-uuid]/`.
   Pass the UUID to every subagent.

2. **Create a branch from `main`.**
   First, run `git status --short` to verify the working tree is clean. If there are uncommitted changes, stop and ask the user to resolve them before proceeding.
   Format: `{type}/{short-description}` (kebab-case).
   Use the conventional commit type matching the feature intent: `feat`, `fix`, `chore`, `docs`, `refactor`.
   Example: `feat/add-watering-schedules`.

3. **Plan** — Spawn two subagents using the `plantz-adlc-plan` skill (following the subagent protocol).
   Pass: `run-uuid`, feature description.
   When done, verify `./tmp/runs/[run-uuid]/plan.md` exists. If not, fail the run.

4. **Code** — Spawn two subagents using the `plantz-adlc-code` skill.
   Pass: `run-uuid`, `iteration=1`, plan path. Issues path and changes path are `null` for iteration 1.
   When done, verify `./tmp/runs/[run-uuid]/changes-1.md` exists. If not, fail the run.

5. **Test and iterate** — Spawn two subagents using the `plantz-adlc-test` skill.
   Pass: `run-uuid`, `iteration=1`, `run-smoke-tests=true`.
    - If `./tmp/runs/[run-uuid]/test-issues-[iteration].md` is produced with issues:
        - Increment the iteration number. Update `orchestrator-state.md` with the new iteration and sub-phase (`code`).
        - Spawn new `plantz-adlc-code` subagents. Pass: `run-uuid`, the new `iteration`, plan path, the previous iteration's issues file path, and the previous iteration's changes file path. They produce `changes-[iteration].md`.
        - Update `orchestrator-state.md` sub-phase to `test`. Determine `run-smoke-tests`: set to `true` if the previous `test-issues-*.md` contained findings under "Visual verification", "Accessibility", or "Keyboard navigation" sections; otherwise `false`.
        - Spawn new `plantz-adlc-test` subagents. Pass: `run-uuid`, the new `iteration`, the determined `run-smoke-tests` value.
        - Repeat until no issues or max iterations reached.
    - **Maximum 3 iterations.** If issues persist after 3 test-fix cycles, stop the run and report the unresolved issues to the user.
    - If no issues file is produced (or it's empty), proceed.

6. **Simplify** — Run the `/simplify` skill on all files listed across `./tmp/runs/[run-uuid]/changes-*.md` to review for dead code, redundant abstractions, and over-engineering. After simplification completes, run `pnpm lint` to verify nothing was broken. If lint fails, fix the issues before proceeding.

7. **Document** — Spawn two subagents using the `plantz-adlc-document` skill (following the subagent protocol).
   Pass: `run-uuid`, the final iteration number.

8. **Merge** — Spawn one subagent using the `plantz-adlc-merge` skill. This step uses a single subagent only — concurrent git operations would conflict.
   Pass: `run-uuid`, the branch name from step 2, the commit type from step 2.
   The merge subagent may return control in these cases:
    - **CI failure:** The merge subagent writes `ci-issues-[attempt].md` and returns. The orchestrator spawns `plantz-adlc-code` subagents (2 subagents, following the subagent protocol) with: `run-uuid`, `iteration` continuing from where the test phase left off, plan path, the CI issues file, and the latest changes file. After the fix, spawn a new merge subagent to commit, push, and resume monitoring. **Maximum 2 CI fix attempts** — if CI still fails, stop and report to the user.
    - **PR comments:** The merge subagent writes `pr-comments-[attempt].md` and returns. The orchestrator spawns `plantz-adlc-code` and/or `plantz-adlc-document` subagents to address legitimate comments. After the fix, spawn a new merge subagent to commit, push, resolve comments, and resume monitoring.

9. **Clean up** — Delete the `./tmp/runs/[run-uuid]/` folder.

### State persistence

After completing each step, write the current state to `./tmp/runs/[run-uuid]/orchestrator-state.md`:

```markdown
# Orchestrator State

- Run UUID: [uuid]
- Branch: [branch-name]
- Commit type: [type]
- Current step: [step number]
- Iteration: [current iteration number]
- Sub-phase: [code/test/none] (within step 5 only)
- Status: [completed/in-progress/failed]
```

This allows the orchestrator to recover if the context window is compacted mid-run. At the start of each step, read this file to restore state if needed.

### Run UUID

Every run has its own folder under `./tmp/runs/` to avoid file collisions between concurrent or successive runs. The UUID is generated once at the start and passed to every subagent. The `tmp/` directory is already in `.gitignore`.

### Iteration tracking

The orchestrator maintains the iteration counter (starting at 1). Each test-fix cycle increments it. The counter is passed to subagents so they name their output files correctly:

- `changes-1.md`, `changes-2.md`, ...
- `test-issues-1.md`, `test-issues-2.md`, ...

---

## plantz-adlc-plan

Drafts the technical approach for the feature.

### Inputs (provided by orchestrator)

| Input               | Description               |
| ------------------- | ------------------------- |
| `run-uuid`          | Run folder identifier     |
| Feature description | What the user wants built |

### Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the skills referenced in this skill's `references/` files (React best practices, accessibility, shadcn, frontend-design).
3. Analyze the feature requirements and determine which packages/modules are affected.
4. If a new module or storybook needs to be scaffolded, note it in the plan (do NOT scaffold during planning — that happens during coding).
5. Draft the plan following the **plan output format** below.
6. Write the plan to `./tmp/runs/[run-uuid]/plan.md`.

### Plan output format

The plan file must contain these sections:

```markdown
# Plan: [Feature Name]

## Objective

[1-2 sentences describing what the feature does]

## Affected packages

[List of packages/modules that will be created or modified, with their paths]

## Scaffolding required

[Whether new modules or storybooks need to be scaffolded — list domain + module names]
[Or "None" if no scaffolding needed]

## File changes

[For each affected package, list files to create/modify/delete with a brief description of the change]

## New dependencies

[Any new npm packages to install, in which workspace package, or "None"]

## Implementation notes

[Key technical decisions, patterns to follow, gotchas to watch for]

## Storybook stories

[List of stories to create, with their title convention and variant coverage]

## Acceptance criteria

[How to verify the feature works — specific, testable statements]
```

### Subagent pattern

Spawn two subagents following the subagent protocol: one drafts the plan, the other reviews and challenges it. The final `plan.md` incorporates the reviewer's feedback.

---

## plantz-adlc-code

Implements the plan or fixes issues reported by the test phase.

### Inputs (provided by orchestrator)

| Input        | Description                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`   | Run folder identifier                                                                                                                                                      |
| `iteration`  | Current iteration number (starts at 1). This is the iteration the agent will **write** to (`changes-[iteration].md`).                                                      |
| Plan path    | Always provided — `./tmp/runs/[run-uuid]/plan.md`                                                                                                                          |
| Issues path  | `null` on iteration 1. On fix cycles: the orchestrator passes the explicit path to the **previous** iteration's issues file (e.g., `test-issues-1.md` when `iteration=2`). |
| Changes path | `null` on iteration 1. On fix cycles: the orchestrator passes the explicit path to the **previous** iteration's changes file (e.g., `changes-1.md` when `iteration=2`).    |

### Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the skills referenced in this skill's `references/` files.
3. Read the plan file for architectural context. If an issues file is provided, read it and the previous changes file to understand what was done and what failed. If the issues file contains visual verification or accessibility findings, also read the referenced screenshots in `./tmp/runs/[run-uuid]/screenshots/` for context — visual issues typically require Tailwind class adjustments (`overflow`, `min-height`, `dark:` variants).
4. If `iteration` is 1 and the plan requires scaffolding a new module, load and use the `plantz-scaffold-domain-module` skill. If it requires a new Storybook, use `plantz-scaffold-domain-storybook`. Skip this step on fix iterations (iteration > 1) — scaffolding is already done.
5. Implement the changes. Follow all technology rules from this skill's `references/` files.
6. Write a summary of all changes to `./tmp/runs/[run-uuid]/changes-[iteration].md`.

### Changes file format

```markdown
# Changes — Iteration [N]

## Files created

- `path/to/file.tsx` — [brief description]

## Files modified

- `path/to/file.tsx` — [what changed and why]

## Files deleted

- `path/to/file.tsx` — [why deleted]

## Dependencies added

- `package-name` in `workspace-package` — [why needed]

## Notes

[Anything the test or document phases should know about]
```

### Subagent pattern

Spawn two subagents following the subagent protocol: Subagent A implements the full change set and writes `changes-[iteration].md`. Subagent B receives the same inputs as A (plan path, tech-stack references, issues file if any), reads the changed files listed in `changes-[iteration].md`, applies mechanical fixes directly, and appends a "## Reviewer concerns" section to `changes-[iteration].md` for any design/architecture concerns.

---

## plantz-adlc-test

Validates that the generated code meets quality standards. Does NOT fix issues — only reports them.

### Inputs (provided by orchestrator)

| Input             | Description                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `run-uuid`        | Run folder identifier                                                                        |
| `iteration`       | Current iteration number                                                                     |
| `run-smoke-tests` | `true` on iteration 1. On subsequent iterations, the orchestrator decides (default `false`). |

### Procedure

1. Read all `./tmp/runs/[run-uuid]/changes-*.md` files (1 through current iteration) to build the cumulative set of affected files and pages. This ensures visual verification and quality gates cover the full feature scope, not just the latest fix.
2. Run `pnpm lint` from the workspace root. This includes typecheck and syncpack. Record any errors.
3. Load the `plantz-validate-modules` skill and validate all modules. Record any failures.
4. Verify the changes meet the quality gates from the skill's own reference files:
    - **Code-level checks** (static): semantic HTML structure (lists, headings), `aria-label` on icon-only buttons, form labels, `aria-invalid`/`aria-describedby` on error states, `sr-only` text for color-only indicators, live regions for dynamic content. For each failure, include the file path and element reference so the code skill can act on it.
5. **Visual verification + smoke tests** (automated via `agent-browser`). Only run if `run-smoke-tests` is `true`. Load the `plantz-smoke-tests` skill and run smoke tests for every app. **During each app's server session** (while the dev server is already running), also run the visual verification steps below for every page affected by the changes. This avoids starting dev servers twice.
    - Before starting, create the screenshots directory: `mkdir -p ./tmp/runs/[run-uuid]/screenshots/`.
    - For each affected page:
        1. Navigate to the page. Wait for the page to fully load (network idle).
        2. Take an annotated screenshot in light mode: `screenshot ./tmp/runs/[run-uuid]/screenshots/[page]-light.png --annotate`.
        3. Switch to dark mode: `emulate --color-scheme dark`. Take a screenshot: `screenshot ./tmp/runs/[run-uuid]/screenshots/[page]-dark.png --annotate`. Reset: `emulate --color-scheme light`.
        4. Take an accessibility tree snapshot (`snapshot -i`) to verify all interactive elements have accessible names, correct roles, and logical tab order.
        5. Run a keyboard navigation check: use `press_key Tab` repeatedly (max 50 presses) and after each press use `eval 'document.activeElement?.tagName + " " + (document.activeElement?.textContent?.trim()?.slice(0,40) || document.activeElement?.getAttribute("aria-label") || "")'` to record the focused element. Stop when focus cycles back to the first element. Record the full tab sequence.
        6. Review the annotated screenshots for layout breakage (elements overflowing viewport, zero-height containers) or missing dark mode styles (unstyled backgrounds, invisible text). Do NOT claim to measure contrast ratios — that requires numeric computation, not visual inspection.
    - After all pages are verified, close the browser session before stopping the dev server. Follow the port-cleanup procedure from the `plantz-smoke-tests` skill.
    - **Iteration rule:** Run the full visual verification + smoke tests on iteration 1. On subsequent iterations, the orchestrator decides whether to include them by passing a `run-smoke-tests` flag.

### Output

- If **all checks pass**: do NOT create an output file (absence of the file signals success to the orchestrator).
- If **any check fails**: write the issues to `./tmp/runs/[run-uuid]/test-issues-[iteration].md` with this format:

```markdown
# Test Issues — Iteration [N]

## Lint (includes typecheck + syncpack)

- [error details, or "Pass"]

## Module validation

- [failures, or "Pass"]

## Quality gates (code-level)

- `path/to/file.tsx` — @elementRef: [what's wrong and how to fix it], or "Pass"

## Visual verification

- Screenshots saved to: `./tmp/runs/[run-uuid]/screenshots/`
- `path/to/Component.tsx` — [layout/dark-mode issue description], or "Pass"

## Accessibility

- `path/to/Component.tsx` — @elementRef: [missing name/role/issue], or "Pass"

## Keyboard navigation

- Tab sequence: [tag "label"] → [tag "label"] → ...
- `path/to/Component.tsx` — [unreachable/invisible focus issue], or "Pass"

## Smoke tests

- [failures with app name and error, or "Pass"]
```

### Subagent pattern

Subagent A runs all checks (1-5) sequentially and writes the test issues file. Subagent B reviews the report by spot-checking a sample of findings against actual file contents to catch false positives or missed issues.

---

## plantz-adlc-document

Audits agent documentation for drift after implementation and fixes any issues found.

### Inputs (provided by orchestrator)

| Input       | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `run-uuid`  | Run folder identifier                                                          |
| `iteration` | The latest iteration number (used to know how many `changes-*.md` files exist) |

### Procedure

1. Read all `./tmp/runs/[run-uuid]/changes-*.md` files to understand the full scope of changes.
2. Load the `plantz-audit-agent-docs` skill and run the audit. This detects drift between agent-docs and the actual codebase.
3. If changes affect architectural patterns, check `agent-docs/adr/index.md` and `agent-docs/adr/README.md`. Create a new ADR if a new architectural decision was made. Update the index.
4. If changes affect operational tooling, check `agent-docs/odr/index.md` and `agent-docs/odr/README.md`. Create a new ODR if a new operational decision was made. Update the index.
5. If changes affect any `agent-docs/references/` file, update the affected files. If a new reference topic was introduced, create a new reference file and add an index entry in the root `CLAUDE.md`.
6. Verify the root `CLAUDE.md` index is consistent with all `agent-docs/` files.

### Subagent pattern

One subagent performs the audit and applies fixes. A second subagent reviews the changes to ensure accuracy and completeness. Follow the subagent protocol.

---

## plantz-adlc-merge

Handles committing, pushing, opening a PR, and monitoring CI. Uses a **single subagent** — concurrent git operations would conflict.

### Inputs (provided by orchestrator)

| Input       | Description                                   |
| ----------- | --------------------------------------------- |
| `run-uuid`  | Run folder identifier                         |
| Branch name | The branch created in the orchestrator step 2 |
| Commit type | `feat`, `fix`, `chore`, `docs`, or `refactor` |

### Step 1 — Commit

```bash
git status --short
# Review the output — only stage intentional files
git add [specific files from git status, excluding tmp/, .env, credentials]
git commit -m "$(cat <<'EOF'
{type}: {description}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Use the conventional commit type provided by the orchestrator. The description should be a concise summary derived from aggregating all `./tmp/runs/[run-uuid]/changes-*.md` files.

**Never use `git add -A`** — stage specific files to avoid committing sensitive or temporary files.

### Step 2 — Push and open PR

```bash
git push -u origin {branch-name}
gh pr create --title "{type}: {description}" --body "$(cat <<'EOF'
## Summary
[2-5 bullet points summarizing the feature, derived from changes-*.md files]

## Quality checks
- [x] Lint
- [x] Module validation
- [x] Quality gates (code-level)
- [x] Visual verification (light + dark mode)
- [x] Accessibility + keyboard navigation
- [x] Smoke tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

The quality check boxes should reflect actual test results — mark as `[x]` only checks that passed during the test phase.

### Step 3 — Monitor PR

Poll every 60 seconds, with a maximum wait of 30 minutes per CI cycle.

1. **CI failures:** If any GitHub Actions workflow fails, read the failure logs. Write the errors to `./tmp/runs/[run-uuid]/ci-issues-[attempt].md` using the same format as `test-issues-*.md`. Then **return control to the orchestrator** by reporting the CI failure and the path to the issues file. The merge subagent does NOT fix CI issues itself — subagents cannot spawn further subagents.
2. **PR comments:** Monitor for 10 minutes after CI goes green. If comments are added during that window, evaluate their legitimacy. For legitimate comments, write them to `./tmp/runs/[run-uuid]/pr-comments-[attempt].md` and **return control to the orchestrator**. After the 10-minute window with no comments, report success to the orchestrator.
3. **Chromatic:** When all workflows except Chromatic are green and all PR comments are resolved, add the `run chromatic` label to the pull request. Chromatic is label-gated — adding this label triggers the Chromatic workflows.
4. **Chromatic failure:** If Chromatic workflows fail, tag the repository maintainers in the PR and ask them to review. Do not attempt to fix Chromatic issues autonomously.

### Subagent pattern

This skill runs as a **single subagent**. Do not spawn two — git push/commit conflicts are not recoverable. This subagent cannot spawn further subagents. When CI failures or PR comments require code changes, the merge subagent writes the issues to a file and returns control to the orchestrator, which handles subagent spawning.

---

## Skill metadata

All skills must include YAML frontmatter matching the pattern used by existing `plantz-*` skills:

```yaml
---
name: plantz-adlc-{name}
description: |
    {1-2 sentence description}
disable-model-invocation: true
license: MIT
---
```

## Skill file location

All new skills must be created under `.claude/skills/plantz-adlc-{name}/SKILL.md`. The tech-stack reference files are duplicated across `plantz-adlc-plan`, `plantz-adlc-code`, and `plantz-adlc-test` so each skill is self-contained. The skill-creator writes the references once (in `plantz-adlc-plan`), then copies them to the other two skills with a sync comment at the top of each copy.

## Content placement guide

Where shared content goes in the generated skill files:

- **Subagent protocol, failure handling, state persistence, iteration tracking** → `plantz-adlc-orchestrator` SKILL.md only. Individual skills have their own "Subagent pattern" section describing roles, which is sufficient for subagents.
- **Pre-read requirements** (ARCHITECTURE.md, ADR, ODR) → embedded in the procedure of each skill that needs them (plan, code, test, document).
- **Technology rules** → embedded in each skill's `references/` subfiles (plan, code, test). The `references/` files should include both the absorbed content AND the "load skill X" instructions (e.g., "load the `workleap-react-best-practices` skill for React conventions"). This way, when the procedure says "read all files in this skill's `references/` directory", the agent discovers both the reference content and the skills to load.
- **Scaffolding instructions** → embedded in `plantz-adlc-plan` (notes scaffolding in the plan) and `plantz-adlc-code` (executes scaffolding on iteration 1).
