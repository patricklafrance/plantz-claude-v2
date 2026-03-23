# CI/CD Reference

Seven GitHub Actions workflows in `.github/workflows/`:

| File                   | Purpose                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `ci.yml`               | Secret scan, build, size-limit, oxlint, typecheck, syncpack, test on PRs and main pushes |
| `lighthouse.yml`       | Lighthouse CI — performance gate (error below 0.5, 3 runs, median)                       |
| `chromatic.yml`        | Visual regression via Chromatic                                                          |
| `claude.yml`           | Claude Code agent for issue/PR comments and `/fix` iteration                             |
| `code-review.yml`      | Automated PR code review via Claude                                                      |
| `audit-agent-docs.yml` | Weekly agent-docs freshness audit                                                        |
| `smoke-tests.yml`      | Smoke-test the host app on PRs via Claude                                                |

Read the YAML files directly for triggers, steps, and concurrency rules.

## Claude workflow

`claude.yml` handles two modes, routed by `.github/prompts/claude.md`:

- **General mode** — triggered by `@claude` mentions on issues, PR comments, and reviews.
- **Fix mode** — triggered by `@claude /fix <feedback>` on PR comments. Applies targeted fixes, runs tests, commits, and posts a structured report.

## Chromatic label gate

PRs require the `run chromatic` label to trigger `chromatic.yml`. Without it, the workflow exits early. The label is automatically removed after Chromatic completes.

## Audit agent-docs behavioral flow

`audit-agent-docs.yml` runs weekly (Sunday midnight UTC) and can be triggered manually. The behavior is split between the workflow YAML and `.github/prompts/audit-agent-docs.md`:

- **Critical/High findings**: fixes them in-place and creates a PR against `main`.
- **No Critical/High findings**: creates and immediately closes a GitHub issue with the report.
- **Workflow failure**: creates a GitHub issue linking to the failed run.

## Netlify preview deploys

Netlify automatically deploys a preview for every pull request:

- **Host app** — a full build of `apps/host/` accessible at a unique Netlify preview URL.
- **Unified Storybook** — a full build of `apps/storybook/` accessible at a separate Netlify preview URL.

Preview URLs are posted as PR status checks by the Netlify GitHub integration.

When a PR is merged into `main`, Netlify automatically deploys the Host app to production.

These deploys are independent of the GitHub Actions workflows listed above — Netlify manages its own build pipeline triggered by git push events.
