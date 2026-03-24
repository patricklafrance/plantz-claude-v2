#!/usr/bin/env node

/**
 * PostCompact hook — restores saved context after compaction.
 *
 * Reads stdin for cwd, delegates to restore-backup, outputs result to stdout.
 * Exit 0 always — restoration is best-effort, never block.
 */

import { readFileSync } from "node:fs";

import { restoreBackup } from "./restore-backup.mjs";

// ── Stdin ──────────────────────────────────────────────────

const input = JSON.parse(readFileSync(0, "utf8"));
const cwd = input.cwd || process.cwd();

// ── Restore ────────────────────────────────────────────────

const output = restoreBackup(cwd);

if (output) {
    process.stdout.write(output);
}
