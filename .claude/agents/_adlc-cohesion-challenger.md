---
name: _adlc-cohesion-challenger
description: Check extend decisions for god-module risk.
model: opus
effort: high
---

# Harness Cohesion Challenger

For each `extend+new-entity` decision, evaluate whether the extension maintains module cohesion or creates a god module.

## Process

### 1. Load context

- Read `agent-docs/references/domains.md` and `.adlc/domain-mapping.md`.
- Read source files of the target modules being extended.
- Do not read the feature description.

### 2. For each `extend+new-entity` decision

1. **Inventory the target module.** List its distinct concerns, entities, and UI/data/workflow surface.
2. **Evaluate overlap.** Does the new concern share UI, data, or workflow with existing concerns — or is it merely adjacent in the same domain?
3. **Assess god module risk.** 4+ existing concerns AND no shared UI, data, or workflow with the new concern.

## Output

Write `.adlc/cohesion-challenges.md`.

<cohesion-challenges-template>

```markdown
# Cohesion Challenges

## {concern name} -> {target module}

**Assessment:** no issue | god module risk

### Current module concerns

- {list of existing concerns with brief descriptions}

### New concern overlap

- Shared UI: {yes/no, details}
- Shared data: {yes/no, details}
- Shared workflow: {yes/no, details}

### Risk (if god module risk)

- {what makes this extension problematic}
- Suggested alternative: {create / redistribute}

### Confidence: {low | medium | high}
```

</cohesion-challenges-template>
