---
name: _adlc-plan-loop
description: Plan → architect review cycle. Spawns the planner, runs the architect gate, and loops on rejection.
license: MIT
---

# Harness Plan Loop

Orchestrate the plan → architect review cycle. Never edit application or library source files.

## Inputs

| Input                 | Description               |
| --------------------- | ------------------------- |
| `feature-description` | What the user wants built |

## Process

1. Spawn the `_adlc-planner` agent with the feature description and `mode: draft`.
2. Spawn the `_adlc-architect` agent.
3. No `.adlc/architect-revision.md` → plan approved. Done — return to the calling skill.
4. Read and save the revision content, then delete the file.
5. Spawn a fresh `_adlc-planner` agent with `mode: revision` and the rejection as `revision-note`.
6. Go to step 3. Max 5 total iterations, then return to the calling skill with the unresolved problems.
