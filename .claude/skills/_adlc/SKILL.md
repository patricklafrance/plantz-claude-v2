---
name: _adlc
description: Entry point for end-to-end feature development. Sequences planning, slice-by-slice implementation, and documentation.
model: sonnet
effort: medium
license: MIT
---

# Harness Coordinator

Orchestrate end-to-end feature development. Never edit application or library source files.

## Process

### 1. Prepare

1. Working tree must be clean. If not, print the issue and stop.
2. Delete `.adlc/` if it exists.
3. Create `.adlc/` with `slices/`.

### 2. Domain mapping

- Spawn the `_adlc-domain-mapper` agent with the feature description.
- If the agent fails, print the error and stop.
- Produces `.adlc/domain-mapping.md` — placement decisions the planner carries forward.

### 3. Plan loop

Plan → architect review cycle. Max 5 iterations.

1. Spawn the `_adlc-planner` agent with the feature description and `mode: draft`. If the agent fails, print the error and stop.
2. Spawn the `_adlc-architect` agent. If the agent fails, print the error and stop.
3. No `.adlc/architect-revision.md` → plan approved. Continue to step 4.
4. Read and save the revision content, then delete the file.
5. Resume the `_adlc-planner` agent via `SendMessage` with `mode: revision` and the rejection as `revision-note`. If the agent fails, print the error and stop.
6. Go back to sub-step 2. Max 5 total iterations — if exceeded, print the unresolved problems and stop.

### 4. Branch

- Pull `main` and create `{type}/{short-description}`. Do not push.

### 5. Slice loop

Code → verify cycle. Max 5 fix attempts per slice. Process each slice in `.adlc/slices/` numerically. For each slice:

1. Copy the slice file to `.adlc/current-slice.md` (overwrite if exists).
2. Spawn the `_adlc-explorer` agent. If the agent fails, print the error and stop.
3. Spawn the `_adlc-coder` agent with the slice file and `mode: draft`. If the agent fails, print the error and stop.
4. Spawn the `_adlc-reviewer` agent pointing at the slice file. If the agent fails, print the error and stop.
5. All criteria pass and no sanity issues:
    1. Rename `verification-results.md` to `verification-{slice-filename}.md` (e.g. `verification-01-user-list.md`).
    2. Run `/simplify`.
    3. Commit the slice changes (no push).
    4. Delete `.adlc/current-slice.md`, `.adlc/current-package-map.md`, and `.adlc/current-explorer-summary.md`.
    5. Move to the next slice.
6. Read and save the verification content, then delete `verification-results.md`.
7. Resume the `_adlc-coder` agent via `SendMessage` with `mode: revision` and the saved verification report as `verification-results`.
8. Go back to sub-step 4. Max 5 fix attempts per slice — if exceeded, print the unresolved failures and stop.

### 6. Doc phase

- Spawn the `_adlc-document` agent.
- If the agent fails, print the error and stop.
- The documenter reads `.adlc/` artifacts directly and updates agent-docs to reflect what was implemented.

### 7. PR

- Spawn the `_adlc-pr` agent with the feature description.
- If the agent fails, print the error and stop.

### 8. Monitor

- Spawn the `_adlc-monitor` agent with the PR number returned by the previous step.
- If the agent fails, print the error and stop.
