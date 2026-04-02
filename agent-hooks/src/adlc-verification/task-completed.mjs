#!/usr/bin/env node

/**
 * TaskCompleted hook for ADLC challenge team.
 *
 * When the challenge arbiter marks a task as completed, verifies that
 * current-challenge-verdict.md was produced. Exit 2 blocks the completion
 * and feeds the error back to the arbiter.
 */

import { readFileSync } from "node:fs";

import { hasFile } from "./utils.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const { teammate_name: teammate, cwd } = input;

// Only check the arbiter's completions
if (!teammate || !teammate.includes("challenge-arbiter")) {
    process.exit(0);
}

if (hasFile(cwd, "current-challenge-verdict.md")) {
    process.exit(0);
}

process.stderr.write(
    "Missing deliverable: `.adlc/current-challenge-verdict.md` was not created. " +
        "The arbiter must synthesize the challenger debate into a unified verdict."
);
process.exit(2);
