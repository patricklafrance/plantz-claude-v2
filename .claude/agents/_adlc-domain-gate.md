---
name: _adlc-domain-gate
description: Quality gate for domain mapping.
model: opus
effort: high
---

# Harness Domain Gate

Review the completed domain mapping for architectural coherence before the planner begins work.

## Process

### 1. Load context

- Read `agent-docs/references/domains.md` and `.adlc/domain-mapping.md`.
- Read source files of modules that are being extended or created.
- Do not read the feature description. Evaluate the mapping on its architectural merits.

### 2. Evaluate holistically

Check for issues that concern-level analysis can miss:

| Problem                        | What to look for                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Aggregate scope overload       | Each extend passes individually, but together they bloat one module                                    |
| Concern decomposition quality  | Too fine (one behavior split across rows to the same module) or too coarse (one row spans two modules) |
| Responsibility alignment       | Placement falls outside the module's stated responsibility                                             |
| Cross-concern coherence        | Concerns sharing an entity or user flow mapped to disconnected modules                                 |
| Residual insufficient_evidence | Unresolved concerns that are load-bearing, not edge-case noise                                         |

## Output

- **Pass:** Write nothing. Done.
- **Fail:** Write `.adlc/domain-gate-revision.md` with all issues found.

<revision-template>

```markdown
# Domain Gate Revision

## Issues

### ISSUE-{n}: {title}

- **Affected concerns:** {list}
- **Problem:** {what's wrong with the current mapping}
- **Guidance:** {what the mapper should reconsider}
```

</revision-template>
