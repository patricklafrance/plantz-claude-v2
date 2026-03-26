# agent-browser

CLI tool for browser automation, installed as a workspace devDependency. Load the `agent-browser` skill to learn the commands.

## When to use

After implementing UI changes — before reporting a task complete, verify that your changes render correctly in the browser.

You do NOT need agent-browser for:

- Pure backend/config/tooling changes
- Changes fully covered by lint, typecheck, or unit tests
- Story-only changes (Storybook a11y tests via `pnpm test` cover these)

## Dev servers

| Target            | Command              | Port | URL                     |
| ----------------- | -------------------- | ---- | ----------------------- |
| Host app          | `pnpm dev-host`      | 8080 | `http://localhost:8080` |
| Unified storybook | `pnpm dev-storybook` | 6006 | `http://localhost:6006` |

Use the **host app** for route-based verification (page navigation, login flows, cross-module interactions). Use the **unified storybook** for story-based verification (component variants, visual states).

Always stop the dev server when done:

```bash
# Linux:
kill -9 $(lsof -ti :8080) 2>/dev/null   # host
kill -9 $(lsof -ti :6006) 2>/dev/null   # storybook
# Windows:
netstat -ano | grep :<PORT> | grep LISTENING
taskkill //PID <PID> //T //F
```

## Efficiency guidelines

Each Bash call has overhead. Minimize round-trips with these techniques.

### Batch command

Combine commands that don't need intermediate output into a single `batch` call:

```bash
echo '[
  ["open", "http://localhost:6006/?path=/story/..."],
  ["wait", "--load", "networkidle"],
  ["snapshot", "-i", "-c"]
]' | pnpm exec agent-browser batch --json
```

Use `--bail` to stop on first error. Use batch for: open+wait+snapshot, multi-field fills, open+wait+screenshot.

### Scoped snapshots

Full-page snapshots waste tokens. Scope them down:

```bash
pnpm exec agent-browser snapshot -i -c              # interactive + compact
pnpm exec agent-browser snapshot -i -c -s "#main"   # scoped to CSS selector
pnpm exec agent-browser snapshot -i -d 3            # limit tree depth
```

### DOM verification over screenshots

Prefer text-based DOM checks over screenshots — they're faster and use fewer tokens.

**`diff snapshot`** — shows what changed after an action:

```bash
pnpm exec agent-browser snapshot -i          # baseline
pnpm exec agent-browser click @e2            # action
pnpm exec agent-browser diff snapshot        # +/- diff of the DOM tree
```

**`eval --stdin`** — batch multiple checks into one call:

```bash
pnpm exec agent-browser eval --stdin <<'EOF'
JSON.stringify({
  rowCount: document.querySelectorAll('table tbody tr').length,
  hasDialog: !!document.querySelector('[role=dialog]'),
  buttonText: document.querySelector('button[type=submit]')?.textContent
})
EOF
```

**Boolean checks:** `is visible <sel>`, `is enabled <sel>`, `is checked <sel>`.

Reserve screenshots for when you need to verify visual rendering (layout, colors, spacing).

### Semantic locators

Use `find` for one-step locate+action instead of snapshot → find ref → click:

```bash
pnpm exec agent-browser find role button click --name "Create Household"
pnpm exec agent-browser find text "Sign In" click
```

## Host app

### Authentication

The host app requires login. Demo credentials: `alice@example.com` / `password`.

### Routes

| Route                     | Module                              |
| ------------------------- | ----------------------------------- |
| `/`                       | today/landing-page (index redirect) |
| `/today`                  | today/landing-page                  |
| `/today/vacation-planner` | today/vacation-planner              |
| `/management/plants`      | management/plants                   |
| `/management/user`        | management/user                     |

## Storybook URL pattern

Stories are addressed by their kebab-cased title and story name:

```
http://localhost:6006/?path=/story/{kebab-title}--{story-name}
```

Example: a story with title `Management/Plants/Pages/PlantsPage` and export `Default` maps to:

```
http://localhost:6006/?path=/story/management-plants-pages-plantspage--default
```
