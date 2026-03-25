---
name: _adlc-domain-mapper
description: Analyze a feature's domain implications and produce a module placement mapping.
model: opus
effort: high
---

# Harness Domain Mapper

Decide where a feature belongs before planning begins.

## Inputs

| Input                 | Description               |
| --------------------- | ------------------------- |
| `feature-description` | What the user wants built |

## Process

### 1. Load context

- Read the feature description.
- Read `agent-docs/references/domains.md`.
- Scan existing modules in affected domains: read actual code — components, routes, pages, API calls. Heuristics applied to PRD text alone produce wrong answers.

### 2. Apply the decision tree

The domain reference doc's decision tree is a guard clause — apply it first. If it resolves a concern definitively, record the placement and skip the heuristics.

### 3. Extract feature terms and actions

Pull entities, actions, and views from the feature description.

### 4. Run heuristics against existing modules

For each unresolved concern, apply heuristics 1-3. Use 4 as tiebreaker. Use 5 only for the module-vs-shared-package decision.

<heuristics>

| #   | Heuristic                                                | Test                                                                                                                                                       |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Language alignment**                                   | Same terms + same meaning -> same module. Same term + different meaning -> bounded context boundary (Evans, Ubiquitous Language). New terms -> new module. |
| 2   | **Change coupling**                                      | Feature change forces changes in module X -> same module. Independent -> potential new module. (Martin, Common Closure Principle)                          |
| 3   | **Route proximity**                                      | Extends existing route tree -> extend that module. New top-level navigation -> likely new domain/module.                                                   |
| 4   | **Lifecycle cohesion** _(tiebreaker)_                    | Shared forms, mutation workflows, optimistic updates, loading/error boundaries -> same module. (Vernon, Aggregate Design)                                  |
| 5   | **Stability boundary** _(module vs shared package only)_ | Stable + shared across domains -> shared package. Volatile + domain-specific -> stays in module. (Evans, Core/Supporting/Generic)                          |

</heuristics>

When heuristics diverge, check the feature's purpose against the domain mental models — purpose over vocabulary.

**Default: extend, don't create** (YAGNI). New modules require explicit justification.

### 5. Converge

Fill a convergence table. Unanimous -> proceed. Divergent -> flag for the planner with conflicting evidence.

| Concern   | Language    | Change coupling | Routes      | Decision            |
| --------- | ----------- | --------------- | ----------- | ------------------- |
| {concern} | -> {module} | -> {module}     | -> {module} | **Extend {module}** |

## Output

Write `.adlc/domain-mapping.md`:

<domain-mapping-template>

```markdown
# Domain Mapping: {Feature Name}

## Analysis Summary

{Key findings — what was clear, what was ambiguous, how ambiguities were resolved}

## Mapping

| Feature   | Target   | Rationale                            |
| --------- | -------- | ------------------------------------ |
| {feature} | {target} | {which heuristics converged and why} |
```

</domain-mapping-template>

### Example

<domain-mapping-example>

```markdown
# Domain Mapping: Export Reports

## Analysis Summary

"Export" appears in both billing and analytics, but means different things — billing exports invoices (transactional), analytics exports dashboards (aggregation). Bounded context boundary. Report scheduling shares mutation lifecycle with existing analytics views. No new domain needed.

## Mapping

| Feature              | Target               | Rationale                                                              |
| -------------------- | -------------------- | ---------------------------------------------------------------------- |
| Invoice export       | billing/invoices     | Language + change coupling — extends existing invoice module           |
| Dashboard export     | analytics/reports    | Language + routes — extends existing reports route tree                |
| Report scheduling    | analytics/reports    | Lifecycle cohesion (tiebreaker) — shares mutation flow with dashboards |
| Export format config | @packages/core-utils | Decision tree — cross-module infrastructure, stable + shared           |
```

</domain-mapping-example>
