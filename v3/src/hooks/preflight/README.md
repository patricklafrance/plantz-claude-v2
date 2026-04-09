# Preflight

Stateless `PreToolUse` guardrails and command rewrites.

`preflight` sits before execution and handles two kinds of work:

- normalize or rewrite allowed commands
- block known bad command and read patterns

Unlike `supervisor`, it does not manage recovery contracts or runtime history.

## Why it exists

`preflight` was added after repeated examples of agents wasting time on bad command forms before any higher-order supervision was needed.

The recurring patterns were:

- package-manager drift such as `npx` and `pnpm dlx` when the repo expects `pnpm exec`
- Windows `cmd /c` fallbacks that turned Bash execution into an inconsistent mix of shells
- repeated bare full-workspace `pnpm typecheck` runs when a filtered check or `pnpm lint` would have been the better move
- dependency-source spelunking inside `node_modules` instead of using public APIs, type definitions, or docs

Those are all immediate input-level problems, so they belong in a stateless pre-execution hook.

## Hook entrypoint

- `create-preflight-hook.ts`
    - Registered on `PreToolUse`
    - Handles `Bash`, `Read`, and `Glob`

Flow:

1. Parse the incoming tool call
2. Apply Bash rewrites (agent-browser normalization)
3. Run deterministic block guards in order
4. Return either:
    - `{ continue: true }` -> allow
    - `hookSpecificOutput.updatedInput` -> rewrite
    - `decision: "block"` -> reject

## Why it is separate from `supervisor`

`preflight` is intentionally stateless.

It is for immediate, local rules such as:

- this command form is disallowed
- this path should not be read
- this command should be rewritten before execution

It is not responsible for:

- repeated behavior over time
- recovery loops
- per-run autonomy control
- evidence-based install gating

Those belong to `supervisor`.

## Files

- `create-preflight-hook.ts` — hook factory, applies rewrites then guards
- `utils.ts` — shared command splitting and path helpers
- `agent-browser-rewrite.ts` — rewrites bare `agent-browser ...` to `pnpm exec agent-browser ...`
- `block-npm.ts` — blocks `npm`, `npx`, `pnpx`, and `pnpm dlx`
- `block-windows-cmd.ts` — blocks `cmd /c` and `cmd //c`
- `block-bare-typecheck.ts` — blocks bare `pnpm typecheck` without `--filter`
- `block-node-modules-read.ts` — blocks `Read` and `Glob` access to `node_modules` (type definitions allowed); blocks Bash inspection commands into `node_modules`

## Rewrites

### `agent-browser`

If Bash starts with a bare `agent-browser ...`, it is rewritten to:

```bash
pnpm exec agent-browser ...
```

This keeps browser usage on the expected package-manager path.

Why this was added:

- browser commands were being invoked in inconsistent forms
- keeping them on `pnpm exec` avoids package-runner drift and matches the repo convention

## Block rules

### Package-manager rules

Blocked:

- `npm`
- `npx`
- `pnpx`
- `pnpm dlx`

Reason:

- enforce consistent `pnpm` / `pnpm exec` usage

### `cmd` rule

Blocked:

- `cmd /c ...`
- `cmd //c ...`

Reason:

- avoid falling back into Windows `cmd` wrappers
- keep Bash command handling consistent

### Bare typecheck rule

Blocked:

- `pnpm typecheck`
- `pnpm run typecheck`

Allowed:

- `pnpm lint` — full lint pipeline including typecheck
- scoped typecheck targeting a specific package

Reason:

- `pnpm typecheck` runs at the root only — no per-package checks, no caching
- agents were repeating it multiple times with no new information between runs

### `node_modules` read rule

Blocked:

- `Read` on paths inside `node_modules` (except type definitions)
- `Glob` patterns targeting `node_modules` (except patterns targeting type definitions)
- Bash inspection commands targeting `node_modules` (`rg`, `grep`, `find`, `cat`, `ls`)

Allowed:

- `Read` on type definition files (`.d.ts`, `.d.mts`, `.d.cts`) inside `node_modules`
- `Glob` patterns ending in `.d.ts`, `.d.mts`, or `.d.cts` that target `node_modules`

Reason:

- prevent dependency-source spelunking during implementation
- `.d.ts` files are explicitly allowed because they are the public type contract

## Public hook contract

`preflight` only returns three shapes:

- allow:
    - `{ continue: true }`

- rewrite:
    - `hookSpecificOutput.updatedInput`

- block:
    - `decision: "block"`
    - `reason: "<message>"`

It does not write `.adlc` state and does not append event logs.
