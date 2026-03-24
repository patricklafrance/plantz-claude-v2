---
name: _adlc-pr
description: Commit, push, and open a PR with a summary of the feature and technical changes.
model: opus
---

# Harness PR

Create a pull request that summarizes the feature and the technical changes.

## Inputs

| Input                 | Description               |
| --------------------- | ------------------------- |
| `feature-description` | What the user wants built |

## Process

### 1. Load context

- Read `.adlc/plan-header.md`.
- Read `.adlc/implementation-notes.md`.

### 2. Create the PR

Push the branch and open a PR. The title should be short and descriptive of the feature. Return the PR number.

<pr-body-template>

```markdown
## Summary

{What this feature does from the user's perspective — derived from the feature description}

## Technical Changes

{Most important structural changes — new modules, new packages, data model additions, new ADRs. Derived from plan-header and implementation-notes.}
```

</pr-body-template>
