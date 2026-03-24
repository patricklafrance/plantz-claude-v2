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

1. Copy the slice file to `.adlc/current-slice.md` (overwrite if exists).
2. Spawn the `_adlc-coder` agent with the slice file and `mode: draft`.
3. Spawn the `_adlc-reviewer` agent pointing at the slice file.
4. All criteria pass and no sanity issues:
    1. Rename `verification-results.md` to `verification-{slice-filename}.md` (e.g. `verification-01-user-list.md`).
    2. Run `/simplify`.
    3. Commit the slice changes (no push).
    4. Delete `.adlc/current-slice.md`.
    5. Done — return to the calling skill.
5. Read and save the verification content, then delete `verification-results.md`.
6. Resume the `_adlc-coder` agent via `SendMessage` with `mode: revision` and the saved verification report as `verification-results`.
7. Go to step 3. Max 5 fix attempts, then delete `.adlc/current-slice.md` and return to the calling skill with the unresolved failures.
