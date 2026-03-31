---
name: _adlc-domain-mapper
description: Produce a module placement mapping.
model: opus
effort: high
---

# Harness Domain Mapper

Decide where a feature belongs before planning begins.

## Inputs

| Input                 | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `feature-description` | What the user wants built                            |
| `mode`                | `draft` / `evidence-revision` / `challenge-revision` |

## Modes

### `draft` (default)

Run the full process below (steps 1-6). If `.adlc/domain-gate-revision.md` exists, read it and incorporate the gate issues as constraints.

### `evidence-revision`

The Evidence Researcher has produced `.adlc/evidence-findings.md` with structured observations and inferences for your evidence gaps. Incorporate the findings and re-evaluate all rows in the mapping — not just the ones that were `insufficient_evidence`. Update `.adlc/domain-mapping.md` with revised decisions.

### `challenge-revision`

Challengers have produced `.adlc/sprawl-challenges.md` and/or `.adlc/cohesion-challenges.md`. For each challenge:

1. Read the challenger proposals.
2. For each challenge, you see **two competing proposals on equal footing** — the challenger's proposal and your original decision. Treat these as "Proposal A" and "Proposal B" without anchoring on which is yours. Select the proposal with stronger artifact-level evidence.
3. If rejecting a challenger's proposal:
    - Cite specific artifact-level evidence for why the proposal fails
    - Acknowledge the challenger's strongest argument and explain why it doesn't hold
4. If accepting a challenger's proposal, update the decision accordingly.
5. Update `.adlc/domain-mapping.md` with the resolved decisions. Add a `## Challenge Resolution` section documenting what was accepted, what was rejected, and the evidence for each.

## Process

### 1. Load context

- Read the feature description.
- Read `agent-docs/references/domains.md`.
- Scan existing modules in affected domains: read actual code — components, routes, pages, API calls. Heuristics applied to PRD text alone produce wrong answers.

### 2. Apply the decision tree

The domain reference doc's decision tree is a guard clause — apply it first. If it resolves a concern definitively, record the placement and skip the heuristics.

### 3. Extract feature terms and actions

Pull entities, actions, and views from the feature description.

### 3b. Answer forcing questions

Before applying heuristics, answer these three questions. Separate observations (what you see in the code) from inferences (what you conclude from observations).

**ENTITY_DECOMPOSITION:** What are the distinct entities in this feature? For each entity: is it new, or does it extend an existing entity already owned by a module? List the entity name, whether it is new or existing, and if existing, which module owns it.

**CROSS_MODULE_DEPENDENCIES:** Which entities in this feature need to be accessed by more than one module? Does any dependency violate the module isolation rule (modules never import from each other)? If cross-module access is needed, identify the shared package candidate.

**MUTATION_LIFECYCLE_SPLIT:** For each concern: where does the mutation (create/update/delete) happen vs. where does the read/display happen? Are they in the same module? If mutation and display are in different modules, the concern likely spans a domain boundary.

### 4. Run heuristics against existing modules

**Default position: extend an existing module.** Creation requires all applicable heuristics (1-4) to independently support it. If any heuristic supports extension, the burden is on creation to cite a specific artifact-level failure — not "reduces cohesion" or "introduces new concepts" but a concrete conflict (route tree collision, lifecycle incompatibility, isolation violation).

For each unresolved concern, apply heuristics 1-4. Use 5 only for the module-vs-shared-package decision.

<heuristics>

| #   | Heuristic                                                | Test                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Language alignment**                                   | Same terms + same meaning -> same module. Same term + different meaning -> bounded context boundary (Evans, Ubiquitous Language). New terms -> check lifecycle coupling (see forcing questions). New vocabulary alone does not justify a new module. |
| 2   | **Change coupling**                                      | Feature change forces changes in module X -> same module. Independent -> potential new module. (Martin, Common Closure Principle)                                                                                                                    |
| 3   | **Route proximity**                                      | Extends existing route tree -> extend that module. New top-level navigation -> likely new domain/module.                                                                                                                                             |
| 4   | **Lifecycle cohesion** _(tiebreaker)_                    | Shared forms, mutation workflows, optimistic updates, loading/error boundaries -> same module. (Vernon, Aggregate Design)                                                                                                                            |
| 5   | **Stability boundary** _(module vs shared package only)_ | Stable + shared across domains -> shared package. Volatile + domain-specific -> stays in module. (Evans, Core/Supporting/Generic)                                                                                                                    |

</heuristics>

When heuristics diverge, check the feature's purpose against the domain mental models — purpose over vocabulary.

### 5. Converge

Fill a convergence table. **All applicable heuristics (1-4) must be evaluated for every concern.** A "create" verdict requires unanimous agreement across all heuristics. If any heuristic supports extension, the decision must be "extend" unless the mapper cites a specific artifact-level failure that makes extension infeasible (route tree collision, lifecycle incompatibility, isolation violation). "Introduces new concepts" and "reduces cohesion" without naming the conflicting artifacts are not valid failures.

If heuristics genuinely conflict and you lack enough information to resolve the conflict, emit `insufficient_evidence` with structured evidence gaps (see output template).

Use `extend+new-entity` (not plain `extend`) when the concern places entities from the Entity Decomposition that are marked "new" into an existing module. This triggers the cohesion challenger to evaluate god-module risk.

| Concern   | Language    | Change coupling | Routes      | Lifecycle   | Decision                                                    |
| --------- | ----------- | --------------- | ----------- | ----------- | ----------------------------------------------------------- |
| {concern} | -> {module} | -> {module}     | -> {module} | -> {module} | extend / extend+new-entity / create / insufficient_evidence |

### 6. Write output

Write `.adlc/domain-mapping.md` using the template below.

## Output

<domain-mapping-template>

```markdown
# Domain Mapping: {Feature Name}

## Forcing Question Answers

### Entity Decomposition

{entity list with new/existing status and owning module}

- Observations: {what was found in the code}
- Inferences: {what was concluded}

### Cross-Module Dependencies

{entities needing cross-module access, shared package candidates}

- Observations: ...
- Inferences: ...

### Mutation/Lifecycle Split

{per-concern mutation vs display locations}

- Observations: ...
- Inferences: ...

## Convergence Table

| Concern   | Language    | Change Coupling | Routes      | Lifecycle   | Decision                                |
| --------- | ----------- | --------------- | ----------- | ----------- | --------------------------------------- |
| {concern} | -> {module} | -> {module}     | -> {module} | -> {module} | extend / create / insufficient_evidence |

## Mapping

| Concern   | Target   | Decision              | Rationale                                         |
| --------- | -------- | --------------------- | ------------------------------------------------- |
| {concern} | {target} | extend                | {heuristics + evidence}                           |
| {concern} | {target} | extend+new-entity     | {heuristics + evidence, new entity named}         |
| {concern} | {target} | create                | {which module considered, artifact-level failure} |
| {concern} | --       | insufficient_evidence | {conflicting signals, what would resolve}         |

## Evidence Gaps (if any insufficient_evidence rows)

### GAP-{n}: {title}

- **Conflicting signals:** {what points where}
- **What would resolve it:** {specific factual question}
- **Modules to investigate:** {which modules to inspect}

## Analysis Summary

{Key findings — what was clear, what was ambiguous, how ambiguities were resolved}
```

</domain-mapping-template>

### Example

<domain-mapping-example>

```markdown
# Domain Mapping: Export Reports

## Forcing Question Answers

### Entity Decomposition

- **Invoice**: existing entity, owned by `billing/invoices`
- **Dashboard**: existing entity, owned by `analytics/reports`
- **ExportFormat**: new entity, no current owner
- **Schedule**: new entity, but extends existing scheduling in `analytics/reports`
- Observations: `billing/invoices` has InvoiceType, InvoiceListItem. `analytics/reports` has Dashboard, DashboardWidget, ReportSchedule.
- Inferences: ExportFormat is cross-cutting (used by both domains). Schedule extends existing ReportSchedule concept.

### Cross-Module Dependencies

- ExportFormat needed by both billing and analytics -> shared package candidate
- Observations: No existing shared type for export formats. Each module has its own download logic.
- Inferences: Extract ExportFormat to @packages/core-utils to avoid duplication.

### Mutation/Lifecycle Split

- Invoice export: mutation (trigger export) and display (download) both in billing
- Dashboard export: mutation and display both in analytics
- Report scheduling: mutation (create schedule) in analytics, no cross-module display
- Observations: All mutation/display pairs are co-located within their respective modules.
- Inferences: No lifecycle split — supports extending existing modules.

## Convergence Table

| Concern              | Language                | Change Coupling         | Routes               | Lifecycle            | Decision          |
| -------------------- | ----------------------- | ----------------------- | -------------------- | -------------------- | ----------------- |
| Invoice export       | -> billing/invoices     | -> billing/invoices     | -> billing/invoices  | -> billing/invoices  | extend            |
| Dashboard export     | -> analytics/reports    | -> analytics/reports    | -> analytics/reports | -> analytics/reports | extend            |
| Report scheduling    | -> analytics/reports    | -> analytics/reports    | -> analytics/reports | -> analytics/reports | extend+new-entity |
| Export format config | -> @packages/core-utils | -> @packages/core-utils | N/A                  | N/A                  | extend            |

## Mapping

| Concern              | Target               | Decision          | Rationale                                                                               |
| -------------------- | -------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| Invoice export       | billing/invoices     | extend            | Language + change coupling — extends existing invoice module                            |
| Dashboard export     | analytics/reports    | extend            | Language + routes — extends existing reports route tree                                 |
| Report scheduling    | analytics/reports    | extend+new-entity | Lifecycle cohesion — shares mutation flow with dashboards, but Schedule is a new entity |
| Export format config | @packages/core-utils | extend            | Decision tree — cross-module infrastructure, stable + shared                            |

## Analysis Summary

"Export" appears in both billing and analytics, but means different things — billing exports invoices (transactional), analytics exports dashboards (aggregation). Bounded context boundary per heuristic #1. Report scheduling shares mutation lifecycle with existing analytics views. No new domain needed. ExportFormat extracted to shared package per heuristic #5 (stable, cross-domain).
```

</domain-mapping-example>
