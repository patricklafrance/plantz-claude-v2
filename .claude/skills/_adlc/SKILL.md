---
name: _adlc
description: End-to-end feature development.
model: opus
effort: medium
license: MIT
---

# Harness Coordinator

Orchestrate end-to-end feature development. Never edit application or library source files.

## Process

### 1. Prepare

1. Working tree must be clean. If not, print the issue and stop.
2. Delete `.adlc/` if it exists.
3. Create `.adlc/` with `slices/`, `implementation-notes/`, `verification-results/`, `challenges/`, and `screenshots/`.

### 2. Domain mapping

Run the domain mapping pipeline. Max 2 gate attempts.

#### 2a. Mapper

1. Delete `.adlc/current-evidence-findings.md`, `.adlc/current-sprawl-challenges.md`, and `.adlc/current-cohesion-challenges.md` if they exist.
2. Spawn the `_adlc-domain-mapper` agent with the feature description and `mode: draft`. If the agent fails, print the error and stop.

#### 2b. Evidence resolution (conditional)

1. Read `.adlc/domain-mapping.md`. If no row has Decision = `insufficient_evidence`, skip to 2c.
2. Spawn the `_adlc-evidence-researcher` agent. If the agent fails, print the error and stop.
3. Resume the `_adlc-domain-mapper` agent via `SendMessage` with `mode: evidence-revision`. If the agent fails, print the error and stop.

#### 2c. Challenger (conditional)

1. Read `.adlc/domain-mapping.md`. Determine which challengers are needed:
   - If any row has Decision = `create` or `new-package`: spawn `_adlc-sprawl-challenger`.
   - If any row has Decision = `extend+new-entity`: spawn `_adlc-cohesion-challenger`.
   - Spawn needed challengers in parallel. If either fails, print the error and stop.
2. If challenges `.adlc/current-sprawl-challenges.md` or `.adlc/current-cohesion-challenges.md` were produced: resume the `_adlc-domain-mapper` via `SendMessage` with `mode: challenge-revision`. If the agent fails, print the error and stop.
3. Rename each `current-*-challenges.md` to `.adlc/challenges/{type}-{attempt}.md` (where `{type}` is `sprawl` or `cohesion` and `{attempt}` is the gate attempt number, starting at 1).

#### 2d. Gate

1. Delete `.adlc/placement-gate-revision.md` if it exists.
2. Spawn the `_adlc-placement-gate` agent. If the agent fails, print the error and stop.
3. No `.adlc/placement-gate-revision.md` → gate passed. Proceed to step 3.
4. If first gate attempt: go back to 2a.
5. If second gate attempt: print the gate issues and stop.

### 3. Plan loop

Plan → plan-gate review cycle. Max 5 iterations.

1. Spawn the `_adlc-planner` agent with the feature description and `mode: draft`. If the agent fails, print the error and stop.
2. Spawn the `_adlc-plan-gate` agent. If the agent fails, print the error and stop.
3. No `.adlc/plan-gate-revision.md` → plan approved. Continue to step 4.
4. Resume the `_adlc-planner` agent via `SendMessage` with `mode: revision`. If the agent fails, print the error and stop.
5. Delete `.adlc/plan-gate-revision.md`.
6. Go back to sub-step 2. Max 5 total iterations — if exceeded, print the unresolved problems and stop.

### 4. Branch

- Pull `main` and create `{type}/{short-description}`. Do not push.

### 5. Slice loop

Code → verify cycle. Max 5 fix attempts per slice. Process each slice in `.adlc/slices/` numerically. For each slice:

1. Copy the slice file to `.adlc/current-slice.md` (overwrite if exists).
2. Spawn the `_adlc-explorer` agent. If the agent fails, print the error and stop.
3. Spawn the `_adlc-coder` agent with `mode: draft`. If the agent fails, print the error and stop.
4. Spawn the `_adlc-reviewer` agent. If the agent fails, print the error and stop.
5. All criteria pass and no sanity issues:
   1. Rename `.adlc/verification-results.md` to `.adlc/verification-results/{slice-filename}.md`.
   2. Commit the slice changes (no push).
   3. Delete `.adlc/current-slice.md` and `.adlc/current-explorer-summary.md`.
   4. Move to the next slice.
6. Resume the `_adlc-coder` agent via `SendMessage` with `mode: revision`. If the agent fails, print the error and stop.
7. Rename `.adlc/verification-results.md` to `.adlc/verification-results/{slice-filename}-{attempt}.md`.
8. Go back to sub-step 4. Max 5 fix attempts per slice — if exceeded, print the unresolved failures and stop.

### 6. Simplify

- Spawn the `_adlc-simplify` agent. If the agent fails, print the error and stop.

### 7. Doc phase

- Spawn the `_adlc-document` agent. If the agent fails, print the error and stop.

### 8. PR

- Spawn the `_adlc-pr` agent with the feature description. If the agent fails, print the error and stop.

### 9. Monitor

- Spawn the `_adlc-monitor` agent with the PR number returned by the previous step. If the agent fails, print the error and stop.
