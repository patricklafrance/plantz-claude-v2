/**
 * Reads the backup written by the /safe-compact skill, returns formatted
 * context for injection into the post-compact conversation, then deletes
 * the backup file so it doesn't leak into future compactions.
 *
 * Returns the formatted string, or empty string if no backup exists.
 */

import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

export function restoreBackup(cwd) {
    const backupPath = resolve(cwd, "tmp", "pre-compact.md");

    try {
        const content = readFileSync(backupPath, "utf8");

        // Clean up — one-time use.
        unlinkSync(backupPath);

        if (!content.trim()) {
            return "";
        }

        return [
            "# Restored Session Context (auto-injected by post-compact hook)",
            "",
            "The following context was saved by the /safe-compact skill before compaction.",
            "Use it to resume work without losing track of decisions, progress, and next steps.",
            "",
            "---",
            "",
            content
        ].join("\n");
    } catch {
        // No backup file or read error — nothing to restore.
        // This is fine: compaction can happen without a backup (e.g. auto-compact).
        return "";
    }
}
