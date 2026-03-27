/**
 * Shared utilities for subagent-stop verification hooks.
 * All functions are pure — no module-level state.
 */

import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

export { run } from "../shared/run.mjs";

// ── .adlc artifact helpers ─────────────────────────────────

/** True when the file exists in .adlc/ and is non-empty. */
export function hasFile(cwd, relativePath) {
    const abs = resolve(cwd, ".adlc", relativePath);
    try {
        return statSync(abs).size > 0;
    } catch {
        return false;
    }
}

/** Filenames in an .adlc/ subdirectory, optionally filtered by extension. */
export function listFiles(cwd, relativeDir, ext) {
    const abs = resolve(cwd, ".adlc", relativeDir);
    try {
        const entries = readdirSync(abs);
        return ext ? entries.filter(f => f.endsWith(ext)) : entries;
    } catch {
        return [];
    }
}

// ── Shell / git helpers ────────────────────────────────────

/** Files changed in the working tree (modified + untracked) relative to cwd. */
export function getChangedFiles(cwd) {
    try {
        const modified = execSync("git diff --name-only HEAD", { cwd, encoding: "utf8" });
        const untracked = execSync("git ls-files --others --exclude-standard", { cwd, encoding: "utf8" });
        const files = `${modified}\n${untracked}`.trim().split("\n").filter(Boolean);
        return [...new Set(files)];
    } catch {
        return [];
    }
}
