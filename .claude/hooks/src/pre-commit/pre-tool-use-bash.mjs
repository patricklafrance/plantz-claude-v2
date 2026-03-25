#!/usr/bin/env node

/**
 * PreToolUse/Bash — pre-commit gate.
 *
 * Intercepts `git commit` Bash calls and runs a validation pipeline.
 * Handlers return a list of problems: empty → allow, non-empty → block.
 *
 * Exit 0 + no output        → allow tool call
 * Exit 0 + JSON { decision } → block tool call, feed reason back to Claude
 */

import { readFileSync } from "node:fs";

import handlePreCommit from "./handler.mjs";

// ── Stdin ──────────────────────────────────────────────────

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";

// Only intercept git commit commands (raw or rtk-wrapped).
if (!/\bgit\s+commit(?:\s|$)/.test(command)) {
    process.exit(0);
}

// ── Run pipeline ───────────────────────────────────────────

const cwd = process.cwd();
const problems = await handlePreCommit(cwd);

if (problems.length === 0) {
    process.exit(0);
}

process.stdout.write(
    JSON.stringify({
        decision: "block",
        reason: `Pre-commit checks failed.\n\n${problems.join("\n\n")}`
    })
);
