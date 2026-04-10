## V3 Orchestrator

This directory contains the ADLC orchestrator built on `@anthropic-ai/claude-agent-sdk`. It is a standalone Node.js project — not part of the monorepo's turborepo workspace.

### Commands

- `pnpm install` — install dependencies
- `pnpm test` — run tests
- `pnpm build` — compile TypeScript

### Structure

- `src/cli.ts` — CLI entry point
- `src/config.ts` — Model IDs, defaults, port base
- `src/ports.ts` — Port allocation helper
- `src/progress.ts` — Progress tracking and duration formatting
- `src/workflow/` — Pipeline entry point, steps, and agent definitions
  - `orchestrator.ts` — Pipeline entry point, sequences all steps
  - `agents/loader.ts` — Agent .md parser + `runAgent()` SDK query helper
  - `agents/*.md` — Agent definition files (15 agents)
  - `steps/placement.ts` — Domain mapping + placement gate loop
  - `steps/plan.ts` — Plan draft + adversarial challenge loop
  - `steps/slices/` — DAG-aware wave execution with parallel slices
    - `dag/` — Slice dependency parser and wave scheduler
    - `worktree/` — Git worktree lifecycle (create, seed, merge, collect, remove)
    - `revision-loop.ts` — Per-slice explorer → coder ↔ reviewer loop
  - `steps/simplify.ts`, `document.ts`, `pr.ts`, `monitor.ts` — Post-processing steps
- `src/hooks/` — SDK hook wiring
  - `create-hooks.ts` — Hook assembly, creates SDK hooks config
  - `pre-commit/create-pre-commit-hook.ts` — PreToolUse/Bash commit gate (oxfmt, build, lint, tests, gitignore guard)
  - `guards/create-guards-hook.ts` — PreToolUse guards (block-npm, block-windows-cmd, etc.)
  - `supervisor/` — PreToolUse+PostToolUse policies (browser-thrash, wall-clock, etc.)
    - `create-supervisor-hooks.ts` — Factory wiring shared state
    - `create-supervisor-pre-tool-hook.ts` — PreToolUse policy chain
    - `create-supervisor-post-tool-hook.ts` — PostToolUse install-bypass scanner
  - `post-agent-checks/create-post-agent-checks-hook.ts` — SubagentStop post-agent checks and handlers
  - `post-agent-checks/metrics.ts` — Transcript metrics recording and artifact archival

### Key design

- Agent prompts live as `.md` files in `src/workflow/agents/`, parsed at runtime by `src/workflow/agents/loader.ts`
- Skills and agent-docs come from the **target repo** (the repo being worked on), not from v3
- Supervisor state is in-memory (no disk I/O), managed by `src/hooks/supervisor/state.ts`
- Hook callbacks are pure functions wrapped in SDK `HookCallbackMatcher` format
