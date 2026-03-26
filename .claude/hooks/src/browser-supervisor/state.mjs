/**
 * Shared state for the browser supervisor.
 *
 * File: `.adlc/supervisor-state.json`
 * Resets per run (`.adlc/` is deleted by the coordinator at startup).
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STATE_FILE = "supervisor-state.json";

const DEFAULT_STATE = {
    consecutiveBrowserCalls: 0,
    totalBrowserCalls: 0,
    screenshotNudgeFired: false
};

export function readState(cwd) {
    try {
        return { ...DEFAULT_STATE, ...JSON.parse(readFileSync(resolve(cwd, ".adlc", STATE_FILE), "utf8")) };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

export function writeState(cwd, state) {
    const dir = resolve(cwd, ".adlc");
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, STATE_FILE), JSON.stringify(state, null, 4) + "\n");
}
