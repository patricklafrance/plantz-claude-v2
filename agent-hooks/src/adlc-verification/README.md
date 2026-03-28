# ADLC Verification

Post-completion verification for ADLC subagents.

This hook family runs on `SubagentStop` and validates the work produced by ADLC agents before the workflow advances.

It is not a live runtime controller like `supervisor`. It is a stop-time verification and cleanup pipeline.

## What it improves in the harness

`adlc-verification` makes the ADLC workflow materially more reliable by turning agent completion into a gated handoff instead of a trust-based handoff.

Concretely, it improves the harness by:

- preventing an agent from declaring success when required deliverables are still missing
- catching structural problems at the boundary between workflow stages instead of letting them leak downstream
- auto-fixing low-value issues like formatting before they become noisy failures
- pushing concise, actionable failures back to the same agent while its context is still fresh
- recording run metrics so the harness can measure cost, tool usage, and retry behavior over time

Without this hook family, the ADLC loop would depend much more on agents remembering to self-verify and on later stages discovering earlier mistakes by accident.

## Hook entrypoint

- `subagent-stop.mjs`
    - Registered on `SubagentStop`
    - Routes by `agent_type`
    - Records run metrics for all agent runs
    - Blocks completion when a handled agent still has problems to fix

High-level flow:

1. Parse the stop-hook input
2. If already in a stop-hook continuation, allow through and still record metrics
3. Route to the handler for the current ADLC agent type
4. Run that handler’s checks / autofixes / reminders
5. If problems remain, block and feed them back to the agent
6. If clean, record metrics and allow the stop

## Router and shared modules

The main router lives in `subagent-stop.mjs`.

Handled agent types:

- `_adlc-architect`
- `_adlc-coder`
- `_adlc-document`
- `_adlc-domain-mapper`
- `_adlc-planner`
- `_adlc-reviewer`

Unhandled agent types are allowed through, but their metrics are still recorded.

Shared modules:

- `subagent-stop.mjs`
    - main router

- `run-metrics.mjs`
    - transcript parsing and run-metric recording

- `utils.mjs`
    - `.adlc` artifact helpers (`hasFile`, `listFiles`) and git helpers (`getChangedFiles`)
    - re-exports `run` from `../shared/run.mjs` so coder modules can import from a single place

## Per-agent handler structure

Each handled agent has its own folder and `handler.mjs`.

The handler normally composes a small pipeline of:

- verificators
- autofixers
- context refreshers
- cleanup steps

Handlers return:

- `[]` -> allow stop
- `string[]` -> block stop with those problems

## Per-agent harness value

### `_adlc-domain-mapper`

What the hook enforces:

- the mapping artifact must exist
- plan files must not be mutated

What this improves:

- domain placement becomes explicit before planning starts
- the mapper cannot silently drift into planner responsibilities

### `_adlc-planner`

What the hook enforces:

- `plan-header.md` must exist
- at least one slice file must exist
- every slice must contain acceptance criteria
- every slice must contain a `Reference Packages` section

What this improves:

- the plan handed to later agents is structurally usable
- slices are harder to leave vague or underspecified
- downstream agents have the minimum planning scaffolding they need

### `_adlc-architect`

What the hook enforces:

- plan files must not be mutated
- revision feedback must cite specific slices with evidence

What this improves:

- architect review stays read-only
- revisions are actionable instead of generic opinions

### `_adlc-coder`

What the hook enforces:

- formatting is auto-fixed first
- build, lint, and tests must pass
- file-level disable comments are rejected
- secrets are rejected
- import-boundary violations are rejected
- implementation notes must exist
- changed components need story coverage
- context refresh reminders fire once per slice
- dev-server ports are cleaned up at the end

What this improves:

- code is less likely to advance with hidden structural debt
- the coder cannot “finish” while skipping stories, notes, or architecture rules
- repeated retries become more focused because failures are returned as a concrete checklist

### `_adlc-reviewer`

What the hook enforces:

- verification results must exist
- every slice acceptance criterion must be covered

What this improves:

- review output is tied back to the actual plan
- “review complete” becomes evidence-based instead of informal

### `_adlc-document`

What the hook enforces:

- document updates go through the document-agent pipeline

What this improves:

- documentation changes are normalized before the workflow continues

### All ADLC agents

What the hook enforces:

- run metrics are recorded from the transcript
- handled agents are blocked on outstanding problems
- unhandled agents still contribute metrics

What this improves:

- the workflow has visibility into cost, timing, and tool usage
- a stage cannot quietly hand off broken work and hope the next stage catches it

## Run metrics

`run-metrics.mjs` parses each agent transcript JSONL and records:

- model
- token usage
- cache usage
- tool counts
- tool token estimates
- per-tool durations when they can be reconstructed
- total wall time
- started/completed timestamps

It also writes per-run detail files with individual tool-call records.

This happens for:

- handled agents
- unhandled agents
- resumed stop-hook continuations

## Public hook contract

`adlc-verification` returns:

- allow:
    - no output

- block:
    - `decision: "block"`
    - `reason: "<agent-specific problems>"`

The returned block reason is intended to be fed back to the same agent so it can fix the listed problems before the workflow continues.
