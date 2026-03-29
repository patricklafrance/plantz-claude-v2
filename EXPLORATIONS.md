# Explorations

Investigations into tools, patterns, or approaches that were evaluated but **not adopted**. Kept here so future sessions don't re-investigate the same ground.

---

## RTK (Rust Token Killer)

**Date:** 2026-03-28
**Repo:** https://github.com/rtk-ai/rtk
**Verdict:** Not adopted — low ROI for this repo

### What it is

RTK is a Rust CLI proxy (~14.7K stars, v0.34.0) that sits between AI coding agents and shell commands, compressing Bash output before feeding it back to the LLM context window. It hooks into Claude Code via `PreToolUse`, rewriting Bash commands (e.g., `git status` -> `rtk git status`). Claims 60-90% token reduction through smart filtering, grouping, truncation, and deduplication.

### Why it was evaluated

We investigated whether RTK could meaningfully reduce token consumption in the ADLC pipeline.

### Why it was rejected

1. **Wrong bottleneck.** Read/Write/Edit tools account for ~70-80% of token growth. RTK only intercepts Bash command output.
2. **agent-browser dominance.** ~65% of Bash calls are `agent-browser` commands (our custom browser automation binary). RTK has no filter for it.
3. **Already self-truncated.** Build output is piped through `tail -N` patterns in agent code, pre-truncating before RTK could act.
4. **Tiny target.** Git-heavy agents (planner, architect) are the only RTK-compressible category and represent ~3% of total tokens.
5. **Windows issues.** Known stack overflow on startup (issue #855), no automated hook setup (`rtk init -g` falls back to degraded CLAUDE.md injection mode).
6. **Security concerns.** Shell injection via `sh -c` in `rtk err/test/summary` (issue #640), opt-out telemetry, full command strings stored in SQLite for 90 days.
7. **Estimated savings: ~4%** of total tokens (4-6M out of 128M) — doesn't justify setup and maintenance burden.

### Supporting data (from 30-step ADLC run)

| Agent type               | Steps | Tokens | % of total | Bash profile                                                          |
| ------------------------ | ----- | ------ | ---------- | --------------------------------------------------------------------- |
| Coders (Sonnet)          | 8     | ~96.5M | 75%        | 103 Bash calls in heaviest run; mostly agent-browser + pnpm with tail |
| Reviewers (Opus)         | 8     | ~24.5M | 19%        | Dominated by agent-browser                                            |
| Explorers (Sonnet)       | 5     | ~3.3M  | 3%         | 2 Bash calls each (generate-package-map + rm)                         |
| Planner/Architect/Others | mixed | ~7.1M  | 6%         | git/gh commands — the only RTK-compressible category                  |

---

## Parallel Slice Execution via Git Worktrees

**Date:** 2026-03-28
**Verdict:** Not adopted — nesting restriction blocks clean architecture; marginal gains don't justify complexity

### What it is

Run multiple slices simultaneously by giving each slice its own git worktree. Each worktree gets the full explorer → coder → reviewer trio. The planner would identify which slices can be developed in parallel based on its existing `Depends on` declarations, producing "waves" of parallelizable work.

### Why it was evaluated

The ADLC pipeline processes slices strictly sequentially. For features with parallelizable dependency graphs (e.g., the household feature has 3 slices that only depend on the foundation), wall-clock time could be reduced by running independent slices concurrently.

### Dependency graph example (household feature)

```
Wave 1: Slice 1 (Foundation)         ← sequential, must complete first
Wave 2: Slices 2, 3, 5              ← parallel (all depend only on Slice 1)
Wave 3: Slice 4                      ← depends on 1, 3
Wave 4: Slice 6                      ← depends on 3, 4, 5
```

6 sequential slices → 4 waves, with wave 2 running 3 slices simultaneously.

### What makes it technically plausible

1. **Claude Code supports `isolation: "worktree"` on agents** — each subagent gets its own git worktree and branch.
2. **Turborepo 2.8+ (this repo uses 2.8.12) shares cache across worktrees** — no redundant rebuilds.
3. **pnpm's content-addressable store** — `pnpm install` in each worktree is fast (symlinks to global store).
4. **Squide module isolation (ADR-0001)** — modules never import each other, so parallel slices touching different modules produce no file conflicts.
5. **Slices already declare `Depends on`** — the planner already has the dependency information needed to compute waves.

### The fundamental blocker: no nested subagent spawning

**Subagents cannot spawn other subagents.** This is a hard restriction in Claude Code ([#4182](https://github.com/anthropics/claude-code/issues/4182), [#19077](https://github.com/anthropics/claude-code/issues/19077), [#32731](https://github.com/anthropics/claude-code/issues/32731)).

The natural architecture is a 3-level hierarchy:

```
Orchestrator → Slice Runner (per worktree) → Explorer / Coder / Reviewer
```

This is impossible because the slice runner (a subagent) cannot spawn explorer/coder/reviewer (sub-subagents). Agent team teammates also cannot spawn anything.

### Evaluated workarounds

#### Option 1: Flatten to 2 levels (orchestrator spawns everything)

The orchestrator creates worktrees via Bash, then directly spawns all agents across all parallel slices. Each agent's prompt specifies the worktree's absolute path.

**Problems:**

- **SubagentStop hooks fire with wrong `cwd`** — hooks run build/lint/test against the orchestrator's directory, not the worktree. Every hook would need worktree-awareness.
- **Agents have no `cwd` parameter** — must use absolute paths for every tool call (Read, Write, Edit, Glob, Grep). One relative path and the agent writes to the wrong repo.
- **Reviewers are hard to parallelize** — each starts Storybook + host app dev server. 3 simultaneous instances means 3× memory, port management, and `agent-browser` routing.
- **Revision loops break clean fan-out** — orchestrator juggles N independent state machines (each slice's revision loop) simultaneously.
- **Context accumulation** — orchestrator holds results from N explorers + N coders + N reviewers, pushing context significantly higher than sequential flow.

#### Option 2: External Node.js orchestrator

A script outside Claude Code spawns N `claude` CLI processes (one per worktree). Each is a top-level instance that can spawn its own subagents. Bypasses the nesting restriction entirely but **leaves the ADLC framework** — loses hooks, supervision, structured agent definitions.

#### Option 3: Bash `claude --agent` workaround

A subagent invokes `claude --agent` via Bash to spawn nested agents. No structured error propagation, no progress tracking, no SubagentStop hooks, poor debuggability. Too fragile for production.

### Estimated gains

For the household feature (3 parallel slices in wave 2):

- **Coder parallelism saves ~40 min** (3 × ~20 min → ~20 min)
- **Explorer overhead: ~6 min** (2 min × 3, even if parallel)
- **Reviewer overhead: ~24 min** (8 min × 3, likely sequential)
- **Merge overhead: ~5-10 min**
- **Net savings: ~20-30 min** on a 3-4.5 hour run (~10-15% wall clock reduction)

Savings scale with more parallelizable slices, but many features have linear dependency chains where parallelism doesn't help.

### Decision

Deferred. The engineering cost (hook modifications, port management, revision loop state machines, merge conflict handling) is high relative to ~10-15% wall clock savings. Revisit if:

- Claude Code lifts the nested subagent restriction
- A feature requires 5+ parallelizable slices where the gain justifies the complexity
- An external orchestrator approach becomes worth building for other reasons
