# ADLC Orchestrator (v3)

A headless CLI that plans, implements, and ships features using a multi-agent pipeline. Built on the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk), it replaces the in-process SKILL.md orchestrator with an external Node.js process that supports parallel slice execution via git worktrees.

## What changed from v2

| Aspect           | v2 (SKILL.md)                                      | v3 (Agent SDK)                              |
| ---------------- | -------------------------------------------------- | ------------------------------------------- |
| Orchestration    | `_adlc` skill runs inline in the main conversation | External Node.js process — `pnpm exec adlc` |
| Parallelism      | Sequential slices on one branch                    | Parallel slices via git worktrees           |
| Supervisor state | Disk-based JSON in `.adlc/supervisor-state.json`   | In-memory — no I/O between tool calls       |
| Hook protocol    | stdin/stdout JSON over subprocess boundary         | Direct function calls in the same process   |
| Entry point      | `/adlc` slash command inside Claude Code           | `adlc` CLI binary                           |

## Pipeline

```mermaid
flowchart TD
    Start([Feature description]) --> Plan

    subgraph Plan["Planning"]
        direction TB
        DM["Domain Mapper"] --> PG["Placement Gate"]
        PG -. "evidence gaps" .-> ER["Evidence Researcher"] -. "findings" .-> DM
        PG -- "pass" --> Planner
        Planner --> PlanGate["Plan Gate"]
        PlanGate -. "revision" .-> Planner
        PlanGate -- "pass" --> Challenge
        subgraph Challenge["Adversarial Challenge"]
            direction LR
            CC["Cohesion Challenger"] ~~~ SC["Sprawl Challenger"]
        end
        Challenge --> Arbiter
        Arbiter -. "revise" .-> Planner
    end

    Plan -- ".adlc/ artifacts" --> Exec

    subgraph Exec["Slice Execution (parallel waves)"]
        direction TB
        DAG["DAG Scheduler"] --> W0["Wave 0: foundation"]
        W0 --> W1["Wave 1: independent slices"]
        W1 --> W2["Wave N: dependent slices"]

        subgraph Slice["Per-slice (in worktree)"]
            direction LR
            Explorer --> Coder --> Reviewer
            Reviewer -. "failures" .-> Coder
        end
    end

    Exec --> Post

    subgraph Post["Post-processing"]
        direction LR
        Simplify --> Document --> PR --> Monitor
    end

    Monitor --> Done([PR ready])

    style Start fill:#4ade80,stroke:#16a34a,color:#000
    style Done fill:#4ade80,stroke:#16a34a,color:#000
    style Plan fill:#f0f9ff,stroke:#0284c7
    style Exec fill:#fefce8,stroke:#ca8a04
    style Post fill:#f0fdf4,stroke:#16a34a
    style Slice fill:#fff,stroke:#999,stroke-dasharray: 5 5
```

## Agents

Fifteen agents form the pipeline. Each is defined as a markdown file with YAML frontmatter in `src/agents/definitions/`, loaded at runtime by `src/agents/loader.ts`.

| Agent                       | What it does                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `_adlc-domain-mapper`       | Analyzes feature terms against existing modules, writes placement decisions             |
| `_adlc-evidence-researcher` | Resolves mapper evidence gaps by inspecting code artifacts                              |
| `_adlc-placement-gate`      | Holistic quality gate — reviews the entire mapping for architectural coherence          |
| `_adlc-sprawl-challenger`   | Challenges create decisions with concrete extension proposals                           |
| `_adlc-cohesion-challenger` | Checks extend decisions for god-module risk                                             |
| `_adlc-challenge-arbiter`   | Synthesizes challenger debate into unified verdict                                      |
| `_adlc-planner`             | Drafts a multi-slice plan with acceptance criteria per slice                            |
| `_adlc-plan-gate`           | Structural review gate — flags wrong boundaries, missing denormalization, weak criteria |
| `_adlc-explorer`            | Surveys reference packages for a slice, returns patterns summary for the coder          |
| `_adlc-coder`               | Implements a single slice — code, MSW handlers, Storybook stories                       |
| `_adlc-reviewer`            | Verifies acceptance criteria via browser screenshots and interactions                   |
| `_adlc-simplify`            | Reviews changed code for reuse, quality, and efficiency, then fixes issues              |
| `_adlc-document`            | Updates module docs and architecture references to reflect what was built               |
| `_adlc-pr`                  | Pushes branch, opens PR with summary and technical changes                              |
| `_adlc-monitor`             | Polls CI workflows, auto-fixes failures (lint, Chromatic, Lighthouse)                   |

All inter-agent coordination goes through files in `.adlc/` — plan-header, slices, verification-results, implementation-notes, domain-mapping. This makes handoffs explicit and debuggable.

## Runtime supervision

Every agent instance runs with three hook layers, wired as SDK `HookCallbackMatcher` callbacks in `src/hooks/index.ts`.

### Preflight guards

PreToolUse hooks that inspect and optionally rewrite commands before execution.

| Guard                   | Trigger          | What it does                                                                |
| ----------------------- | ---------------- | --------------------------------------------------------------------------- |
| `block-npm`                | Bash             | Blocks `npm`, `npx`, `pnpx`, `pnpm dlx` — only `pnpm` allowed               |
| `block-windows-cmd`        | Bash             | Blocks `cmd` / `cmd.exe` invocations on Windows                             |
| `block-bare-typecheck`     | Bash             | Blocks bare `pnpm typecheck` without `--filter`                             |
| `block-node-modules-read`  | Bash, Read, Glob | Blocks reading `node_modules` source (type definitions `.d.ts` are allowed) |
| `agent-browser-rewrite` | Bash             | Rewrites bare `agent-browser` to `pnpm exec agent-browser`                  |

### Supervisor policies

Stateful policies that observe tool calls in real time. State is in-memory — shared across all tool calls within a single agent run, no disk I/O.

| Policy           | What it detects                | Response                                                                                                                                                                        |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wall-clock`     | Agent running too long         | Nudge at threshold, hard stop at limit. Per-agent thresholds.                                                                                                                   |
| `browser-thrash` | Browser stuck loops            | Dual detection: density (cross-page spirals) + repetition (same-page probing). Tiered recovery gates requiring non-browser work before the next browser call. Total budget cap. |
| `test-thrash`    | Test reruns without code edits | Edit-gap detection with tiered recovery. Requires code changes between test runs.                                                                                               |
| `install-gate`   | Blind `pnpm install`           | Blocks unless manifests changed, an override exists, or a PostToolUse dependency failure grants a one-shot bypass.                                                              |

### Verification handlers

SubagentStop hooks that run post-completion checks per agent type. If any check fails, the problems are fed back to the agent for correction.

#### Verificators

| Agent                       | Check                | What it validates                                                      |
| --------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `_adlc-coder`               | build                | Full monorepo build                                                    |
| `_adlc-coder`               | lint                 | Full monorepo lint — oxlint, oxfmt, typecheck, syncpack, knip          |
| `_adlc-coder`               | tests                | Full monorepo tests — Vitest + Storybook a11y via Playwright           |
| `_adlc-coder`               | no-file-disable      | Rejects file-level `/* oxlint-disable */` comments (line-level only)   |
| `_adlc-coder`               | no-secrets           | gitleaks scan on changed files                                         |
| `_adlc-coder`               | import-guard         | 4-layer architectural boundary enforcement (host > modules > packages) |
| `_adlc-coder`               | implementation-notes | A file in `.adlc/implementation-notes/` must be created or updated     |
| `_adlc-coder`               | story-coverage       | Every changed component in a module needs a matching `.stories.tsx`    |
| `_adlc-planner`             | plan-header          | `.adlc/plan-header.md` must exist and be non-empty                     |
| `_adlc-planner`             | slice-files          | At least one `.md` file in `.adlc/slices/`                             |
| `_adlc-planner`             | slice-criteria       | Every slice must have `- [ ]` acceptance criteria                      |
| `_adlc-planner`             | slice-ref-packages   | Every slice must have a Reference Packages section                     |
| `_adlc-plan-gate`           | no-plan-mutations    | Must not modify plan files (read-only review)                          |
| `_adlc-plan-gate`           | revision-slice-refs  | Revision must reference specific slices with evidence                  |
| `_adlc-domain-mapper`       | mapping-file         | `.adlc/domain-mapping.md` must exist                                   |
| `_adlc-domain-mapper`       | engagement-check     | Every medium+ confidence challenge has a resolution entry              |
| `_adlc-evidence-researcher` | evidence-findings    | `.adlc/current-evidence-findings.md` must exist                        |
| `_adlc-placement-gate`      | no-plan-mutations    | Must not modify plan files                                             |
| `_adlc-placement-gate`      | revision-issues      | If revision exists, must contain `ISSUE` blocks                        |
| `_adlc-reviewer`            | verification-results | `.adlc/verification-results.md` must exist                             |
| `_adlc-reviewer`            | criteria-coverage    | Results must cover every acceptance criterion from the slice           |

#### Context refreshers

| Agent         | Refresh         | What it reminds                                    |
| ------------- | --------------- | -------------------------------------------------- |
| `_adlc-coder` | context-refresh | MSW handlers, story variants, implementation notes |

#### Autofixers

| Agent            | Autofix       | What it does                        |
| ---------------- | ------------- | ----------------------------------- |
| `_adlc-coder`    | oxfmt-autofix | `oxfmt --write .` before lint phase |
| `_adlc-simplify` | oxfmt-autofix | `oxfmt --write .` before lint phase |
| `_adlc-document` | oxfmt-autofix | `oxfmt --write .` after doc updates |

## Parallel execution model

Slices declare dependencies via `> **Depends on:** Slice 1, Slice 3` in their `.md` files. The DAG scheduler (`src/dag/`) topologically sorts slices into waves:

```
Wave 0:  [slice-00 foundation]           # no deps — runs alone
Wave 1:  [slice-01, slice-02, slice-04]   # all depend only on slice-00 — run in parallel
Wave 2:  [slice-03]                       # depends on slice-01
Wave 3:  [slice-05]                       # depends on slice-03 + slice-04
```

Each slice in a wave gets its own git worktree under `.adlc-worktrees/`, with:

- Its own `.adlc/` directory seeded with plan artifacts and prior implementation notes
- Non-overlapping port allocation (Storybook, host app, browser)
- An independent supervisor state

After a wave completes, successful slices merge to the feature branch in dependency order. Failed slices are reported but do not block the rest.

## Usage

### Install

```bash
cd v3
pnpm install
```

### Run the full pipeline

```bash
pnpm exec adlc "Add a household feature with member invitations and plant sharing"
```

### Plan first, review, then execute

```bash
# Draft the plan
pnpm exec adlc --plan-only "Add dark mode support"

# Review the output
cat .adlc/plan-header.md
ls .adlc/slices/

# Execute the existing plan
pnpm exec adlc --from-plan "Add dark mode support"
```

### Control parallelism and budget

```bash
# Limit parallel slices per wave (default: 5)
pnpm exec adlc --max-parallel 3 "Refactor auth module"

# Set per-slice budget cap in USD (default: 15)
pnpm exec adlc --budget 10 "Add unit tests for api package"

# Preview the wave schedule without running anything
pnpm exec adlc --dry-run "Add household feature"
```

### Target a different repo

```bash
pnpm exec adlc --cwd /path/to/other/repo "Add feature X"
```

### CLI reference

```
Usage: adlc [options] <feature-description>

Options:
  --plan-only         Run planning phases only, output plan to .adlc/
  --from-plan         Skip planning, execute from existing .adlc/ plan
  --retry-slice <id>  Retry a single failed slice
  --approve-plan      Pause after planning for manual approval
  --budget <usd>      Max budget per slice (default: 15)
  --max-parallel <n>  Max parallel slices per wave (default: 5)
  --dry-run           Show wave schedule without executing
  --verbose           Show full agent output instead of progress summary
  --cwd <path>        Target repository path (default: current directory)
  -h, --help          Show this help message
```

### Progress output

```
[12:03:01] [plan] Starting planning phase...
[12:03:01] [plan] Domain mapping... done (12s)
[12:03:13] [plan] Placement gate... approved
[12:03:18] [plan] Plan draft... done (45s)
[12:04:03] [plan] Plan gate... passed
[12:04:08] [plan] Challengers (cohesion + sprawl)... done (30s)
[12:04:38] [plan] Arbiter verdict... approved
[12:04:38] [exec] Starting slice execution...
[12:04:38] [wave-0] 1 slice
[12:04:38]   [foundation] [explorer] surveying reference packages
[12:04:38]   [foundation] [coder] draft attempt 1/5
[12:22:04]   [foundation] [reviewer] passed
[12:22:04] [wave-1] 3 slices in parallel (max 5)
[12:22:04]   [invitations] [coder] draft attempt 1/5
[12:22:04]   [plant-sharing] [coder] draft attempt 1/5
[12:22:04]   [member-list] [coder] draft attempt 1/5
[12:45:00] [post] Starting post-processing...
[12:48:30] [done] Feature complete in 45m 29s
```

## Key design decisions

| #   | Decision                             | Rationale                                                                                                                                 |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Agent prompts are markdown files     | Editable and diffable without touching code. Loaded at runtime by `src/agents/loader.ts`.                                                 |
| 2   | Target repo provides skills and docs | The orchestrator is generic. Skills, `agent-docs/`, and `CLAUDE.md` come from the repo being worked on via `settingSources: ["project"]`. |
| 3   | In-memory supervisor state           | No disk I/O between tool calls. Policies mutate a shared object directly.                                                                 |
| 4   | Git worktrees for parallelism        | Each slice gets its own worktree with isolated `.adlc/`, ports, and branch.                                                               |
| 5   | Adversarial reviewer independence    | Reviewers get fresh sessions (no coder context leakage). Coders resume their session for revision passes.                                 |
| 6   | Fail-fast on merge conflicts         | No auto-resolution. The planner should design slices to avoid this.                                                                       |
| 7   | No interactive session support       | V3 is headless. No pre-commit hooks, no safe-compact, no interactive supervision.                                                         |

## Project structure

```
v3/
  src/
    cli.ts                    # Entry point — arg parsing, calls orchestrator
    orchestrator.ts           # Top-level pipeline coordinator with progress
    config.ts                 # Model IDs, budget defaults, port base

    agents/
      loader.ts               # Parses .md frontmatter -> SDK AgentDefinition
      definitions/            # 15 agent prompt files (markdown + YAML frontmatter)

    pipeline/
      planning.ts             # Domain mapping -> plan drafting -> challenge loop
      slicing.ts              # DAG-aware wave execution with parallel worktrees
      revision-loop.ts        # Per-slice: explorer -> coder <-> reviewer retry
      post-processing.ts      # Simplify -> document -> PR -> monitor

    hooks/
      index.ts                # Assembles hooks into SDK HookCallbackMatcher format
      state.ts                # In-memory SupervisorState (replaces disk-based state)
      types.ts                # Local types for SDK hook inputs/outputs
      event-builder.ts        # Constructs supervisor events from tool input
      supervisor.ts           # PreToolUse/PostToolUse wrapping policies
      verification.ts         # SubagentStop routing to handlers
      preflight.ts            # PreToolUse tool guards

    policies/                 # Pure-function supervisor policies
      browser-thrash.ts       # Dual detection (density + repetition) with tiered gates
      wall-clock.ts           # Per-agent nudge + hard stop circuit breaker
      test-thrash.ts          # Edit-gap detection with tiered recovery
      install-gate.ts         # Evidence-gated pnpm install blocking

    verification/
      handlers/               # 9 agent-specific handlers (coder, planner, reviewer, ...)
      checks/                 # 6 shared checks (build, lint, tests, oxfmt, ...)
      coder-specific/         # 5 coder sub-checks
      planner-specific/       # 4 planner sub-checks
      plan-gate-specific/     # 2 plan-gate sub-checks
      reviewer-specific/      # 2 reviewer sub-checks
      domain-mapper-specific/ # 2 domain-mapper sub-checks
      task-completed.ts       # Challenge arbiter verdict file check

    preflight/                # 5 tool guards + utils
    dag/                      # Slice dependency parser + topological wave scheduler
    worktree/                 # Git worktree lifecycle (create/seed/merge/cleanup)
    utils/                    # Shared helpers (run, progress, ports, verification)

  tests/                      # 56 test files — 332 tests
    policies/                 # 65 tests across 4 files
    hooks/                    # 21 tests across 2 files
    verification/             # ~120 tests across ~30 files
    preflight/                # ~30 tests across 5 files
    dag/                      # 13 tests across 2 files
    worktree/                 # 15 tests across 5 files
    pipeline/                 # 20 tests across 3 files
    utils/                    # ~35 tests across 4 files
    agents/                   # 7 tests across 1 file
    fixtures/                 # Markdown fixtures for verification tests
```

## Development

```bash
pnpm test              # Run all 332 tests
pnpm test -- --watch   # Watch mode
pnpm build             # Compile TypeScript to dist/
```
