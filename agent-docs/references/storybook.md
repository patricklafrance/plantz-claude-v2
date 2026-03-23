# Storybook & Chromatic Conventions

For `packages/components/` stories, see that package's own `CLAUDE.md`.

## Title Conventions

- Pages: `{Domain}/{ModulePascalCase}/Pages/{PageName}` (routed views)
- Components: `{Domain}/{ModulePascalCase}/Components/{ComponentName}` (everything else)

## Variant Coverage

Every story file must cover **every visually distinct state**. One story per prop/state combination that produces a visually different rendering. Include edge cases: empty/null fields, long text overflow, boundary conditions, open/closed states. Skip combinations that look identical.

## Chromatic Modes

All domain story files must set in `meta`:

```
parameters: { chromatic: { modes: {
    "light mobile": { theme: "light", viewport: 375 },
    "light tablet": { theme: "light", viewport: 768 },
    "light desktop": { theme: "light", viewport: 1280 },
    "dark mobile": { theme: "dark", viewport: 375 },
    "dark tablet": { theme: "dark", viewport: 768 },
    "dark desktop": { theme: "dark", viewport: 1280 }
} } }
```

Do NOT use legacy `chromatic.viewports`. Does not apply to `packages/components/` primitives (preview-level modes only).

**Date-dependent stories:** Use extreme dates (`new Date(2020, 0, 1)` for "due", `new Date(2099, 0, 1)` for "not due") so snapshots are deterministic. For components displaying the current date, accept an optional prop to inject a fixed date.

## Tailwind CSS Source Scanning

Each domain storybook's `.storybook/storybook.css` must include `@source` directives for every package whose components appear in stories. At minimum: `packages/components/src`, `packages/core-plants/src`, and each domain module's `src`.

**When adding a new module or package:** add a `@source` directive in `apps/host/src/styles/globals.css` and in the relevant domain storybook CSS files.

## Isolation

- Page stories use `fireflyDecorator` (provides Squide runtime + React Router via memory router) and module-specific decorators (`collectionDecorator`, `sessionDecorator`) as needed. Each domain module's `storybook.setup.tsx` defines these. See `msw-tanstack-query.md` for the full setup pattern.
- Extract presentational sub-components (dialogs, cards, sections) so they can be tested with a lighter decorator stack or none at all.
- `packages/components/` stories use no decorators — purely prop-driven. No MSW, collections, or QueryClient.

## A11y Test Suppression

A11y tests run via `addon-a11y` + `addon-vitest` (`pnpm test` in domain storybooks). To suppress a rule for a specific story or all stories in a file, use `parameters.a11y.config.rules` in the story or meta:

```ts
// Suppress for all stories in the file
const meta = {
    parameters: { a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } } },
};

// Suppress for a single story
export const Example: Story = {
    parameters: { a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } } },
};
```

Same suppression policy as static analysis — fix the code first, suppress only for genuine false positives.

## Storybook Roles

| Storybook                                                      | Purpose                                                                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Domain (`@apps/management-storybook`, `@apps/today-storybook`) | Chromatic visual regression (own token, selective runs), a11y tests (`pnpm test` via vitest + addon-a11y), developer workflow |
| Packages (`@apps/packages-storybook`)                          | Chromatic for shared components, developer workflow                                                                           |
