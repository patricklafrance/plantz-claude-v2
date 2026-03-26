#!/usr/bin/env node

/**
 * SubagentStop — Reset browser supervisor state between agents.
 *
 * Each agent gets a fresh browser budget and counter.
 * Deletes `.adlc/supervisor-state.json` on every agent stop.
 *
 * Exit 0 + no output → allow stop (never blocks).
 */

import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const cwd = input.cwd ?? process.cwd();

try {
    unlinkSync(resolve(cwd, ".adlc", "supervisor-state.json"));
} catch {
    // File may not exist — that's fine.
}

process.exit(0);
