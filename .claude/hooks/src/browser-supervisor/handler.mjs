/**
 * Browser supervisor — PreToolUse handler.
 *
 * Registered on Bash, Read, Write, and Edit. Non-Bash tool calls
 * and non-browser Bash calls reset the consecutive counter.
 * Browser Bash calls are checked against three controls in priority order:
 * total budget > circuit breaker > screenshot nudge.
 */

import { circuitBreaker } from "./circuit-breaker.mjs";
import { screenshotNudge } from "./screenshot-nudge.mjs";
import { readState, writeState } from "./state.mjs";
import { totalBudget } from "./total-budget.mjs";

// ── Detection ──────────────────────────────────────────────

export function isBrowserCommand(command) {
    return /pnpm\s+exec\s+agent-browser\b/.test(command);
}

export function isScreenshotCommand(command) {
    return isBrowserCommand(command) && /\bscreenshot\b/.test(command);
}

// ── Core logic ─────────────────────────────────────────────

/**
 * @param {string} toolName  — "Bash", "Read", "Write", or "Edit"
 * @param {string} command   — the Bash command (empty for non-Bash tools)
 * @param {string} cwd
 */
export function evaluate(toolName, command, cwd) {
    const state = readState(cwd);

    // Non-Bash tool call or non-browser Bash call — reset consecutive counter.
    if (toolName !== "Bash" || !isBrowserCommand(command)) {
        if (state.consecutiveBrowserCalls > 0) {
            state.consecutiveBrowserCalls = 0;
            writeState(cwd, state);
        }

        return { action: "allow" };
    }

    // Browser command — increment counters.
    state.consecutiveBrowserCalls++;
    state.totalBrowserCalls++;

    // Check controls in priority order.
    const result = totalBudget(state) ?? circuitBreaker(state) ?? screenshotNudge(isScreenshotCommand(command), state);

    writeState(cwd, state);

    return result ?? { action: "allow" };
}
