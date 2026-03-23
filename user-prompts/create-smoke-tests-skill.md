Create a Claude Code project command at .claude/commands/smoke-tests.md that smoke-tests every application in the repository.
The command should:

1. Read root package.json to discover all dev-\* scripts that start an application (host and all storybooks — not individual modules like dev-management-plants).
2. For each application, sequentially:
    - Start the dev server in the background
    - Wait for it to be ready (watch stdout for the local URL or "ready" message)
    - Open the URL in the browser, take a snapshot, and verify the page loaded without errors (check console for errors too)
    - Take a screenshot as evidence
    - Stop the dev server

3. After all apps are tested, output a summary table: app name, status (pass/fail), and any errors found.

Use the existing command at .github/prompts/audit-agent-docs.md as a formatting reference — the command should be a self-contained prompt file that tells the agent exactly what to do, step by
step. The command must not hardcode app names or ports — it should discover them dynamically so it stays current as apps are added or removed.
