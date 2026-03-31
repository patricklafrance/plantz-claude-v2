# Supervisor

Stateful real-time supervision for Claude Code tool execution.

This hook family sits on the live execution path and enforces runtime reliability rules during a run, not after it.

## Why it exists

`supervisor` was added because some failure modes were not input problems; they only became obvious over time during execution.

The recurring patterns were:

- browser-debugging spirals with too many screenshots or browser calls in a row
- agents running far too long without completing, burning tokens in loose spirals
- blind `pnpm install` retries used as a generic recovery move

These were not well handled by static guardrails alone. They needed:

- rolling state
- live intervention during execution
- wall-clock circuit breakers for runaway agents

## Hook entrypoints

- `pre-tool-use.mjs`
    - Registered on `PreToolUse`
    - Handles `Bash`, `Read`, `Write`, and `Edit`
    - Enforces wall-clock breaker, install gating, and the main runtime policies

- `post-tool-use.mjs`
    - Registered on `PostToolUse` and `PostToolUseFailure` for `Bash`
    - Records narrow evidence from command results
    - Currently used for `pnpm install` bypass evidence

- `subagent-stop.mjs`
    - Registered on `SubagentStop`
    - Clears run-scoped supervisor artifacts between agent runs

## Runtime model

The supervisor operates as a control loop:

1. Observe the next tool call
2. Load live state
3. Apply the event to rolling state
4. Check wall-clock circuit breaker
5. Apply special gates like `pnpm install`
6. Evaluate runtime policies
7. Persist state and events

The main rule is:

- state-transition steps mutate context
- policy steps return decisions
- the router applies decisions and persists once

## Key modules

- `handler.mjs`
    - main router for pre-tool and post-tool flows

- `context.mjs`
    - normalized hook contexts
    - persistence for state and event records

- `state.mjs`
    - rolling supervisor state

- `events.mjs`
    - append-only event logging

- `policies/`
    - policy logic

## Policies

### `wall-clock`

Defined in [wall-clock.mjs](policies/wall-clock.mjs).

Purpose:

- detect and stop agents that run too long without completing
- the only reliable signal for "loose spiral" failure patterns where agents vary their commands enough to evade micro-pattern detection

Behavior:

- on first PreToolUse event, store `startedAt` timestamp in supervisor state
- on every subsequent event, compute elapsed time
- **nudge (T1):** block ONE tool call with a reflection prompt, set `nudgeFired` flag, allow subsequent calls
- **hard stop (T2):** block ALL tool calls, agent returns to coordinator
- different thresholds per agent type
- reset naturally on SubagentStop (state file is deleted between runs)

Per-agent thresholds (nudge / hard stop):

| Agent                      | Nudge (T1)                      | Hard Stop (T2) |
| -------------------------- | ------------------------------- | -------------- |
| \_adlc-coder               | disabled                        | 25 min         |
| \_adlc-reviewer            | 10 min                          | 15 min         |
| \_adlc-explorer            | 5 min                           | 8 min          |
| \_adlc-planner             | 5 min                           | 8 min          |
| \_adlc-plan-gate           | 5 min                           | 8 min          |
| \_adlc-domain-mapper       | 5 min                           | 8 min          |
| \_adlc-pr                  | 5 min                           | 8 min          |
| \_adlc-document            | 5 min                           | 8 min          |
| \_adlc-evidence-researcher | 3 min                           | 5 min          |
| \_adlc-sprawl-challenger   | 3 min                           | 5 min          |
| \_adlc-cohesion-challenger | 3 min                           | 5 min          |
| \_adlc-domain-gate         | 3 min                           | 5 min          |
| \_adlc-monitor             | exempt (has own 30-min timeout) |
| default                    | 10 min                          | 15 min         |

Why this was added:

- a 60+ minute coder stall walked past all micro-pattern policies because LLM agents produce "loose spirals" (varying commands, distributing edits across files) not "tight loops" (identical commands, same file)
- wall-clock time is unambiguous and has zero false-positive risk

### `browser-thrash`

Defined in [browser-thrash.mjs](policies/browser-thrash.mjs).

Purpose:

- reduce browser-debugging spirals

Behavior:

- first screenshot command gets a nudge toward DOM-based inspection
- block after `6` consecutive browser calls
- block after `30` total browser calls in a run

Why this was added:

- browser-heavy reviewer and coder runs were spending too many steps on screenshots and repeated browser retries
- the issue was not browser usage itself, but browser usage without enough source- or log-based diagnosis between attempts

### `test-thrash`

Defined in [test-thrash.mjs](policies/test-thrash.mjs).

Purpose:

- detect test-command spirals where the agent re-runs test suites without making code changes between runs

Behavior:

- track consecutive test commands without an intervening Edit/Write (edit-gap)
- **nudge** after `4` consecutive test runs without edits — block one call with recovery guidance, require 1 edit before next test
- **escalation** if the pattern continues after nudge — stronger guidance, require 2 edits before next test
- **budget cap** at `15` total test commands per agent run — hard stop

Why this was added:

- agents were re-running test suites with different grep/tail filters instead of reading failure output and editing code
- the primary signal is "consecutive test commands without an intervening Edit/Write" (edit-gap), not density
- tiered recovery forces the agent to actually edit code before retrying

### `install-gate`

Defined in [install-gate.mjs](policies/install-gate.mjs).

Purpose:

- stop blind `pnpm install` / `pnpm i` retries
- still allow legitimate dependency-sync recovery

Behavior:

- block install by default
- allow automatically when:
    - `package.json` or `pnpm-lock.yaml` differs from `HEAD`
    - a new untracked `package.json` or `pnpm-lock.yaml` exists
    - a one-shot evidence bypass token is active
    - a run-scoped manual override exists at `.adlc/allow-install`

Why this was added:

- some runs showed `pnpm install` being used as a blind "maybe this helps" move
- at the same time, some installs were legitimate because manifests had changed or the workspace really was out of sync
- so the right policy was not "never install"; it was "install requires evidence or an explicit override"

## Install gate details

The install gate has three separate allow paths.

### 1. Manifest / lockfile drift

Allowed when Git shows:

- tracked changes to `package.json`
- tracked changes to `pnpm-lock.yaml`
- untracked new `package.json`
- untracked new `pnpm-lock.yaml`

This covers legitimate local dependency changes even before `git add`.

Why this path exists:

- agents can legitimately need install after changing manifests
- the repo can also contain real local manifest changes before the current run starts

### 2. Evidence-based bypass

This is the automatic path.

Source:

- `PostToolUse`
- `PostToolUseFailure`

The post-tool handler looks for high-signal dependency-sync failures in actual Bash output, for example:

- missing package imports
- lockfile-out-of-date errors

Important:

- this bypass is `one-shot`
- it expires after a short event window if unused
- it is intentionally narrow

Rejected on purpose:

- relative imports like `./foo`
- alias-style imports like `@/foo`, `#app/foo`, `~ui/button`
- generic type errors
- missing pnpm scripts / obvious command typos

Why this path exists:

- some install needs are only visible after an actual failing command
- but if the matcher is too broad, install becomes a generic escape hatch again
- so this path is intentionally narrow and temporary

### 3. Manual override

This is the explicit escape hatch.

File:

- `.adlc/allow-install`

Rules:

- file must exist
- file must be non-empty
- contents should be a short human-readable justification
- override stays active for the current run
- override is cleared by `SubagentStop`

Each install allowed through this path is logged in `supervisor-events.jsonl`.

Why this path exists:

- an agent may still have a legitimate reason to insist on install when the automatic path does not trigger
- making the override explicit, non-empty, and run-scoped keeps it auditable without forcing a human into the loop

## Supervisor state

Stored in:

- `.adlc/supervisor-state.json`

Key fields:

- `eventCount`
    - count of pre-tool events

- `postEventSequence`
    - fractional suffix counter used to keep post-tool event indexes increasing

- `recentEvents`
    - rolling event window

- `browser`
    - browser counters and screenshot nudge state

- `startedAt`
    - ISO timestamp of the first PreToolUse event in this agent run

- `wallClock`
    - `nudgeFired`: whether the nudge tier has already fired

- `installBypass`
    - one-shot automatic install bypass token

## Event log

Stored in:

- `.adlc/supervisor-events.jsonl`

The log is append-only.

Pre-tool events:

- use integer indexes: `1`, `2`, `3`, ...

Post-tool evidence events:

- use increasing fractional indexes after the latest pre-tool event
- example: `3.001`

This keeps event order reconstructable without affecting the main pre-tool counters.

Why post-tool evidence events are logged:

- if an install later becomes allowed, there should be an audit trail showing whether it was due to evidence or an override
- otherwise the event log and the allow decision drift apart

Important event outcomes include:

- `allow`
- `block`
- `nudge`
- `hard-stop`
- `install-bypass-granted`
- `install-bypass-consumed`
- `install-override-allowed`

## Evidence collection

Evidence collection is intentionally narrow.

The supervisor reads only explicit result fields from Bash hook payloads:

- `tool_response.stdout`
- `tool_response.stderr`
- `tool_response.message`
- `error.message`
- `error.stderr`
- `error.stdout`

It does not recursively walk arbitrary payload objects.

This keeps the evidence surface understandable and auditable.

Why the evidence surface is narrow:

- broad text matching created false positives and made install too easy to unlock
- explicit fields and package-style failures are easier to review and reason about

## Public hook contract

Even when the supervisor records rich event metadata internally:

- `allow` decisions are returned to Claude as `{ "action": "allow" }`
- `block` decisions include a reason string

This keeps the outward hook contract simple while preserving richer internal logging.

## Cleanup

`SubagentStop` clears:

- `.adlc/supervisor-state.json`
- `.adlc/supervisor-events.jsonl`
- `.adlc/allow-install`

That makes supervisor state and manual install overrides run-scoped.
