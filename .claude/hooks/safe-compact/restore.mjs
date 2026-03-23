#!/usr/bin/env node

/**
 * PostCompact restore — injects saved context back into the conversation.
 *
 * Reads the backup written by the /safe-compact skill, outputs it to stdout
 * (which becomes additional context in the post-compact conversation), then
 * deletes the backup file so it doesn't leak into future compactions.
 *
 * Exit 0 always — restoration is best-effort, never block.
 */

import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

// ── Stdin ──────────────────────────────────────────────────

const input = JSON.parse(readFileSync(0, "utf8"));
const cwd = input.cwd || process.cwd();

const backupPath = resolve(cwd, "tmp", "pre-compact.md");

// ── Restore ────────────────────────────────────────────────

try {
    const content = readFileSync(backupPath, "utf8");

    if (content.trim()) {
        process.stdout.write([
            "# Restored Session Context (auto-injected by post-compact hook)",
            "",
            "The following context was saved by the /safe-compact skill before compaction.",
            "Use it to resume work without losing track of decisions, progress, and next steps.",
            "",
            "---",
            "",
            content
        ].join("\n"));
    }

    // Clean up — one-time use.
    unlinkSync(backupPath);
} catch {
    // No backup file or read error — nothing to restore.
    // This is fine: compaction can happen without a backup (e.g. auto-compact).
}
