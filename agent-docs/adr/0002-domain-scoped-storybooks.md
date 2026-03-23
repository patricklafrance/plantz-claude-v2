# ADR-0002: Domain-Scoped Storybooks

## Status

accepted

## Context

Multiple domain areas (management, today) and a shared packages layer each need visual component development and regression testing. A single global Storybook would couple all domains' build times and Chromatic snapshot costs together.

## Options Considered

1. **Per-domain Storybooks** — Each domain and the shared packages layer gets its own Storybook instance. Independent build times, targeted Chromatic costs, and affected-detection per domain.
2. **Single global Storybook** — One Storybook importing stories from all domains. Simpler configuration but longer build times, higher Chromatic costs, and no way to skip unaffected domains.

## Decision

Use per-domain Storybooks (Option 1). Each domain area has a Storybook at `apps/<domain>/storybook/`, and shared packages have one at `packages/storybook/`. This allows independent Chromatic runs that skip unaffected domains. A unified Storybook at `apps/storybook/` aggregates all stories for local development convenience but is not used by Chromatic.

## Consequences

See [ARCHITECTURE.md](../ARCHITECTURE.md#domain-isolation) for the resulting Storybook structure.

Additional implications:

- Separate Chromatic project tokens per domain (`MANAGEMENT_CHROMATIC_PROJECT_TOKEN`, `TODAY_CHROMATIC_PROJECT_TOKEN`, `PACKAGES_CHROMATIC_PROJECT_TOKEN`).
- Adding a new domain requires a new Storybook package, Chromatic token, and an update to `StorybookDependencies` in `scripts/getAffectedStorybooks.ts`.
