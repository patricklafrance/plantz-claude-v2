---
name: _adlc-cohesion-challenger
description: Check extend decisions for god-module risk.
model: opus
effort: high
---

# Harness Cohesion Challenger

For each `extend+new-entity` decision that adds a subfolder to a module or extends a shared package, evaluate whether the extension maintains cohesion or creates a god module/package.

## Process

### 1. Load context

- Read `agent-docs/references/placement.md` and `.adlc/domain-mapping.md`.
- Read source files of the target modules or packages being extended.
- Do not read the feature description.

### 2. For each `extend+new-entity` decision

1. **Inventory the target.** List subfolders with their concerns. Note which share routes, data entities, or lifecycle with each other.
2. **Evaluate overlap.** Start from the mapper's Subfolder Affinity analysis, then verify against code. Shared UI, data, or workflow = cohesive. Merely adjacent = risk.
3. **Assess god module/package risk.** Apply the rules below.

<cohesion-rules>
- Red flag: 4+ existing subfolders AND zero confirmed affinity signals with the new subfolder
- Shared packages: stable infra mixed with volatile feature code = stability boundary mismatch (heuristic #5)
- Many subfolders sharing lifecycle, routes, or data is healthy growth — count alone is not the problem
</cohesion-rules>

## Output

Write `.adlc/current-cohesion-challenges.md`.

<cohesion-challenges-template>

```markdown
# Cohesion Challenges

## {concern name} -> {target module}

**Assessment:** no issue | god module risk

### Current module subfolders

- {list of existing subfolders with brief descriptions}

### New subfolder overlap

- Shared UI: {yes/no, details}
- Shared data: {yes/no, details}
- Shared workflow: {yes/no, details}

### Risk (if god module risk)

- {what makes this extension problematic}
- Suggested alternative: {create new top-level module / redistribute subfolders}

### Confidence: {low | medium | high}
```

</cohesion-challenges-template>
