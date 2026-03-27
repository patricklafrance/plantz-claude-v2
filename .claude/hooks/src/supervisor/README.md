# Supervisor

Stateful real-time supervision for Claude Code tool execution.

This hook family sits on the live execution path and enforces runtime reliability rules during a run, not after it.

## Why it exists

`supervisor` was added because some failure modes were not input problems; they only became obvious over time during execution.

The recurring patterns were:

- browser-debugging spirals with too many screenshots or browser calls in a row
- repeated edits to the same file without progress
- repeated identical Bash commands without a new evidence path
- blind `pnpm install` retries used as a generic recovery move

These were not well handled by static guardrails alone. They needed:

- rolling state
- live intervention during execution
- recovery contracts instead of simple one-time blocks

## Hook entrypoints

- `pre-tool-use.mjs`
    - Registered on `PreToolUse`
    - Handles `Bash`, `Read`, `Write`, and `Edit`
    - Enforces recovery gates, install gating, and the main runtime policies

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
2. Load live state and any active recovery contract
3. Apply the event to rolling state
4. Block immediately if the current action violates an active recovery
5. Apply special gates like `pnpm install`
6. Advance active recovery progress when allowed
7. Evaluate runtime policies
8. Persist state, events, and recovery artifacts

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

- `recovery.mjs`
    - recovery-contract helpers

- `policies/`
    - policy logic

- `post-tool-handlers/`
    - result-phase evidence handlers

## Policies

### `browser-thrash`

Defined in [browser-thrash.mjs](C:/Dev/poc/plantz-claude-v2/.claude/hooks/src/supervisor/policies/browser-thrash.mjs).

Purpose:

- reduce browser-debugging spirals

Behavior:

- first screenshot command gets a nudge toward DOM-based inspection
- block after `6` consecutive browser calls
- block after `30` total browser calls in a run

Why this was added:

- browser-heavy reviewer and coder runs were spending too many steps on screenshots and repeated browser retries
- the issue was not browser usage itself, but browser usage without enough source- or log-based diagnosis between attempts

### `repeated-edit`

Defined in [repeated-edit.mjs](C:/Dev/poc/plantz-claude-v2/.claude/hooks/src/supervisor/policies/repeated-edit.mjs).

Purpose:

- stop churn on the same file

Behavior:

- block on the `6th` `Edit`/`Write` to the same file within the last `12` events
- create a recovery contract
- require diagnosis in `.adlc/supervisor-recovery.md`

Why this was added:

- agents were revisiting the same file over and over without a visible strategy reset
- this kind of edit churn is a strong signal that the agent is trying variants instead of improving its diagnosis

### `tool-call-thrash`

Defined in [tool-call-thrash.mjs](C:/Dev/poc/plantz-claude-v2/.claude/hooks/src/supervisor/policies/tool-call-thrash.mjs).

Purpose:

- stop repeated identical Bash commands when there is no strategy change

Behavior:

- block on the `3rd` identical Bash command in a row
- create a recovery contract
- require a relevant `Read` or a materially different command

Why this was added:

- agents were repeating the same command several times with no edit and no new evidence source
- once that loop starts, the command usually stops adding information and just burns time

### `install-gate`

Defined in [install-gate.mjs](C:/Dev/poc/plantz-claude-v2/.claude/hooks/src/supervisor/policies/install-gate.mjs).

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

## Recovery contracts

Recovery contracts are written to:

- `.adlc/supervisor-recovery.json`

Human-readable diagnosis is written to:

- `.adlc/supervisor-recovery.md`

While a recovery contract is active:

- blocked files stay blocked
- blocked commands stay blocked
- blocked browser usage stays blocked
- only recovery-progress actions are allowed through

Recovery completion is observable, not inferred from hidden reasoning.

Why recovery contracts exist:

- a plain block message is often not enough to steer an autonomous agent back onto a productive path
- recovery contracts turn "stop doing that" into an observable route back to allowed execution

Examples:

- diagnosis file updated
- relevant source was read
- next Bash command changed

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

- `repeatedEdit.byFile`
    - rolling edit/write counts by file

- `toolThrash`
    - repeated command tracking

- `installBypass`
    - one-shot automatic install bypass token

- `policyAttempts`
    - recovery attempt counts by policy

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
- `escalate`
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
- `.adlc/supervisor-recovery.json`
- `.adlc/supervisor-recovery.md`
- `.adlc/allow-install`

That makes both recovery state and manual install overrides run-scoped.
