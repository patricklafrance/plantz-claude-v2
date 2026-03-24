---
name: _adlc-document
description: Update domain documentation after implementation. Reads the domain mapping and updates module scope descriptions.
model: opus
effort: high
---

# Harness Document

Keep agent documentation in sync with what the code actually does.

## Process

### 1. Load context

- Read `.adlc/plan-header.md`.
- Read `.adlc/domain-mapping.md`.
- Read `.adlc/implementation-notes.md` — coder's notes on what was created or extended.

### 2. Update domain reference

Read `agent-docs/references/domains.md`.

- Module scope expanded → update its Domains table description (one line each).
- New module created → add to the Domains table.
- Decision tree no longer routes correctly → fix it.
- Two modules claim overlapping scope → resolve.

### 3. Update architecture doc

Read `agent-docs/ARCHITECTURE.md`. Skip if implementation-notes.md shows only extensions to existing modules.

- New module → add to the repo structure tree and domain isolation section.
- New shared package or subpath export → add to the shared packages description.
- New domain → add to the domain isolation section.

### 4. Update ADR index

Read `agent-docs/adr/index.md`. Skip if the feature only extends existing patterns.

- New architectural pattern → write an ADR following existing format, add to index.

### 5. Update CLAUDE.md indexes

If previous steps added new files to `agent-docs/`, add entries to the Index section of `CLAUDE.md`. Also check domain-scoped `CLAUDE.md` files for any content that needs updating.

### 6. Scan other references

Skim `agent-docs/references/` for any other docs affected by the implementation. Add, update, or remove content as needed.

### 7. Verify consistency

- Domains table in `domains.md` matches repo structure in `ARCHITECTURE.md`.
- ADR index references files that exist.
- CLAUDE.md indexes reference files that exist.

### 8. Commit

Commit all changed files (no push).
