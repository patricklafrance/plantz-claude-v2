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

- Spawn `subagent_type: "_adlc-domain-mapper"` with the feature description.
- Produces `.adlc/domain-mapping.md` — placement decisions the planner carries forward.

### 3. Plan loop

- Spawn `subagent_type: "_adlc-plan-loop"` with the feature description.
- If the plan-loop reports a failure, print the failure and stop.

### 4. Branch

- Pull `main` and create `{type}/{short-description}`. Do not push.

### 5. Slice loop

- Process each slice in `.adlc/slices/` numerically.
- For each slice, spawn `subagent_type: "_adlc-slice-loop"` pointing at the slice file. Each slice commits its own changes.
- If the slice-loop reports a failure, print the failure and stop.

### 6. Doc phase

- Spawn `subagent_type: "_adlc-document"`.
- The documenter reads `.adlc/` artifacts directly and updates agent-docs to reflect what was implemented.

### 7. PR

- Spawn `subagent_type: "_adlc-pr"` with the feature description.

### 8. Monitor

- Spawn `subagent_type: "_adlc-monitor"` with the PR number returned by the previous step.
