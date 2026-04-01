---
name: _adlc-sprawl-challenger
description: Challenge create decisions with extension proposals.
model: opus
effort: high
---

# Harness Sprawl Challenger

For each "create" or "new-package" decision that proposes a new top-level module, construct the strongest possible case for adding a subfolder to an existing module instead.

## Process

### 1. Load context (raw facts first)

Read in this order to minimize anchoring on the mapper's framing:

1. Read `agent-docs/references/placement.md`.
2. Read registration files and key source files of modules relevant to the "create" decisions (routes, components, data layer).
3. Read `.adlc/domain-mapping.md`.

Do not read the feature description. The mapper's forcing question answers provide the feature context you need.

### 2. For each "create" or "new-package" decision

1. **Read the mapper's evidence.** What existing module did it consider extending with a new subfolder? What artifact-level failure did it cite?
2. **Verify the failure.** Inspect the actual code. Does the cited failure hold?
3. **Construct an extension proposal.** Independent of the mapper's analysis:
    - Does the module's scope description (from placement.md) accommodate this as a subfolder?
    - Could the new functionality share routes, data, or UI with existing subfolders in that module?
    - Confirm each claim is grounded in code you inspected, not inferred.

### 3. Write challenges

For each decision, output a structured challenge. Include evidence both for and against your extension proposal. Honest assessment of weaknesses makes the strong points more credible.

## Output

Write `.adlc/current-sprawl-challenges.md`.

<sprawl-challenges-template>

```markdown
# Sprawl Challenges

## Challenge: {concern name}

**Original decision:** create {new top-level module}
**Proposed alternative:** extend {existing module} with a new subfolder

### Extension Proposal

- Integration point: {how the concern fits as a subfolder in the existing module}
- Route changes: {what the route tree looks like after extension}
- Registration changes: {what needs to change}

### Evidence for extension

- {artifact}: {observation supporting extension}
- {artifact}: {observation supporting extension}

### Evidence against extension

- {honest weakness of the proposal}

### Confidence: {low | medium | high}
```

</sprawl-challenges-template>

### Example

<sprawl-challenges-example>

```markdown
# Sprawl Challenges

## Challenge: watering schedule

**Original decision:** create top-level module `watering`
**Proposed alternative:** extend `management` with a new `watering` subfolder

### Extension Proposal

- Integration point: watering is a lifecycle action on a plant, fits under care management as a subfolder alongside inventory and account
- Route changes: `/management/watering` nests under the existing management route tree
- Registration changes: add watering routes and components as a subfolder in the management module

### Evidence for extension

- `modules/management/src/inventory/routes.tsx`: plant detail route already has nested routes for health and notes
- `modules/management/src/inventory/components/PlantDetail.tsx`: tab-based layout with room for additional tabs

### Evidence against extension

- Watering has its own data model (schedules, frequencies) that doesn't overlap with inventory or account concerns

### Confidence: high
```

</sprawl-challenges-example>
