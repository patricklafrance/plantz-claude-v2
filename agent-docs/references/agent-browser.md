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
| `/management/household`   | management/household                |
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
