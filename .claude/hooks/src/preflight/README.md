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

- `pre-tool-use.mjs`
    - Registered on `PreToolUse`
    - Handles `Bash` and `Read`

Flow:

1. Parse the incoming tool call
2. Apply Bash rewrites
3. Run deterministic block checks
4. Return either:
    - no output -> allow
    - `hookSpecificOutput.updatedInput` -> rewrite
    - `decision: block` -> reject

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

- `pre-tool-use.mjs`
    - Main entrypoint

- `handler.mjs`
    - Thin router over rule modules

- `utils.mjs`
    - Shared command splitting and path helpers

- `agent-browser-rewrite.mjs`
    - Rewrites bare `agent-browser ...` to `pnpm exec agent-browser ...`

- `rtk-rewrite.mjs`
    - Rewrites supported Bash commands through `rtk rewrite` when RTK is installed

- `package-manager.mjs`
    - Blocks `npm`, `npx`, `pnpx`, and `pnpm dlx`

- `no-cmd.mjs`
    - Blocks `cmd /c` and `cmd //c`

- `bare-typecheck.mjs`
    - Blocks bare `pnpm typecheck` without `--filter`

- `node-modules-read.mjs`
    - Blocks `Read` access to `node_modules`
    - Blocks Bash inspection commands into `node_modules`

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

### `rtk`

If RTK is installed and the command is supported, `preflight` rewrites the command through:

```bash
rtk rewrite ...
```

If RTK is missing or the command is unsupported, the rewrite is a no-op.

Why this was added:

- large Bash outputs were consuming unnecessary tokens
- RTK gives a deterministic token reduction without changing the repo workflow

## Block rules

### Package-manager rules

Blocked:

- `npm`
- `npx`
- `pnpx`
- `pnpm dlx`

Reason:

- enforce consistent `pnpm` / `pnpm exec` usage

Why this was added:

- agents were repeatedly using `npx` and similar variants even though the repo standard is `pnpm exec`
- those variants are not just style drift; they also make command behavior less predictable across runs

### `cmd` rule

Blocked:

- `cmd /c ...`
- `cmd //c ...`

Reason:

- avoid falling back into Windows `cmd` wrappers
- keep Bash command handling consistent

Why this was added:

- once an agent starts wrapping everything in `cmd /c`, it tends to stay in that mode
- that makes commands harder to reason about and undermines the rest of the Bash-oriented hook chain

### Bare typecheck rule

Blocked:

- `pnpm typecheck`
- `pnpm run typecheck`

Allowed:

- `pnpm lint` — full lint pipeline including typecheck, cached via turbo
- `pnpm exec turbo run typecheck` — typecheck-only across all packages, cached
- `pnpm exec turbo run typecheck --filter=@package` — scoped to one package, cached

Reason:

- `pnpm typecheck` runs `tsgo` at the root only — no turbo, no per-package checks, no caching
- agents were repeating it multiple times with no new information between runs

Why this was added:

- agents were rerunning the bare root typecheck several times in the same run
- the alternatives go through turbo and benefit from caching, so a second run is near-instant

### `node_modules` read rule

Blocked:

- `Read` on paths inside `node_modules`
- Bash inspection commands targeting `node_modules`, such as:
    - `rg`
    - `grep`
    - `find`
    - `cat`
    - `ls`

Reason:

- prevent dependency-source spelunking during implementation

Why this was added:

- agents were diving into `node_modules` to reverse-engineer library internals
- that behavior correlated with long debugging spirals and usually led away from the right fix
- the intended alternatives are public APIs, local type information, or upstream docs

## Public hook contract

`preflight` only returns three shapes:

- allow:
    - no output

- rewrite:
    - `hookSpecificOutput.updatedInput`

- block:
    - `decision: "block"`
    - `reason: "<message>"`

It does not write `.adlc` state and does not append event logs.
