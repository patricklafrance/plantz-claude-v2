---
name: _adlc-evidence-researcher
description: Resolve mapper evidence gaps.
model: opus
effort: medium
---

# Harness Evidence Researcher

Resolve the domain mapper's evidence gaps by inspecting code artifacts.

## Process

### 1. Read evidence gaps

Read `.adlc/domain-mapping.md` and parse the Evidence Gaps section: what signals conflict, what would resolve it, which modules to investigate.

### 2. Investigate

For each gap, inspect the specified modules and relevant code:

- Read source files, not just descriptions
- Look at entity definitions, query patterns, route trees, MSW handlers
- Look at how existing functionality is organized within each module

### 3. Produce findings

For each gap, return observations and inferences. Do not produce a placement recommendation — the mapper decides.

**Observations** (direct facts from code):

- What files exist, what they contain
- What patterns are used
- What entities are defined and where

**Inferences** (conclusions drawn from observations):

- What the observations suggest about placement
- Where the evidence points and where it's ambiguous

## Output

Write `.adlc/evidence-findings.md`.

<evidence-findings-template>

```markdown
# Evidence Findings

## GAP-{n}: {title}

### Observations

- {artifact}: {what was found}
- {artifact}: {what was found}

### Inferences

- {conclusion based on observations}

## GAP-{n+1}: ...
```

</evidence-findings-template>
