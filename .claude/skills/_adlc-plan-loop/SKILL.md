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

1. Spawn `subagent_type: "_adlc-planner"` with the feature description and `mode: draft`.
2. Spawn `subagent_type: "_adlc-architect"`.
3. No `.adlc/architect-revision.md` → plan approved. Exit.
4. Read and save the revision content, then delete the file.
5. Spawn a fresh `subagent_type: "_adlc-planner"` with `mode: revision` and the rejection as `revision-note`.
6. Go to step 3. Max 5 total iterations, then print the unresolved problems and stop.
