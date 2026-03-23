---
name: _adlc-slice-loop
description: Code → verify cycle for a single slice. Spawns the coder, runs browser verification, and loops on failure.
license: MIT
---

# Harness Slice Loop

Orchestrate the code → verify cycle for a single slice. Never edit application or library source files.

## Inputs

| Input        | Description                                  |
| ------------ | -------------------------------------------- |
| `slice-path` | Path to the slice file in `.adlc/slices/` |

## Process

1. Spawn `subagent_type: "_adlc-coder"` with the slice file and `mode: draft`.
2. Spawn `subagent_type: "_adlc-reviewer"` pointing at the slice file.
3. All criteria pass and no sanity issues:
    1. Rename `verification-results.md` to `verification-{slice-filename}.md` (e.g. `verification-01-user-list.md`).
    2. Run `/simplify`.
    3. Commit the slice changes (no push).
    4. Exit.
4. Read and save the verification content, then delete `verification-results.md`.
5. Resume the coder via `SendMessage` with `mode: revision` and the saved verification report as `verification-results`.
6. Go to step 2. Max 5 fix attempts, then print the unresolved failures and stop.
