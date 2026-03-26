/**
 * Circuit breaker — interrupts browser debugging spirals.
 *
 * Blocks after N consecutive browser calls without non-browser work
 * (Read, Write, Edit, or non-browser Bash).
 */

export const THRESHOLD = 6;

function message(n) {
    return [
        `[browser-supervisor] ${n} consecutive browser calls — likely a debugging spiral.`,
        "",
        "STOP and diagnose:",
        "1. Check for errors: `pnpm exec agent-browser errors`",
        "2. Check what changed: `pnpm exec agent-browser diff snapshot`",
        "3. If the issue is in your code, re-read the source and fix before retrying."
    ].join("\n");
}

/**
 * @param {object} state — reads consecutiveBrowserCalls
 * @returns {{ action: "block", reason: string } | null}
 *   null = this control doesn't apply
 */
export function circuitBreaker(state) {
    if (state.consecutiveBrowserCalls >= THRESHOLD) {
        return { action: "block", reason: message(state.consecutiveBrowserCalls) };
    }

    return null;
}
