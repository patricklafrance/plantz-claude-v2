---
name: _adlc
description: Entry point for end-to-end feature development. Sequences planning, slice-by-slice implementation, and documentation.
license: MIT
---

# Harness Coordinator

Orchestrate end-to-end feature development. Never edit application or library source files.

## Process

### 1. Prepare

1. Working tree must be clean. If not, print the issue and stop.
2. Delete `.adlc/` if it exists.
3. Create `.adlc/` with `slices/`.

### 2. Domain mapping

- Spawn the `_adlc-domain-mapper` agent with the feature description.
- If the agent fails, print the error and stop.
- Produces `.adlc/domain-mapping.md` — placement decisions the planner carries forward.

### 3. Plan loop

- Run the `_adlc-plan-loop` skill (invoke via the Skill tool — it runs inline and spawns agents).
- If the plan-loop reports a failure, print the failure and stop.

### 4. Branch

- Pull `main` and create `{type}/{short-description}`. Do not push.

### 5. Slice loop

- Process each slice in `.adlc/slices/` numerically.
- For each slice, run the `_adlc-slice-loop` skill (invoke via the Skill tool) pointing at the slice file. Each slice commits its own changes.
- If the slice-loop reports a failure, print the failure and stop.

### 6. Doc phase

- Spawn the `_adlc-document` agent.
- If the agent fails, print the error and stop.
- The documenter reads `.adlc/` artifacts directly and updates agent-docs to reflect what was implemented.

### 7. PR

- Spawn the `_adlc-pr` agent with the feature description.
- If the agent fails, print the error and stop.

### 8. Monitor

- Spawn the `_adlc-monitor` agent with the PR number returned by the previous step.
- If the agent fails, print the error and stop.
