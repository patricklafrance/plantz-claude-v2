import { formatRecoveryMessage } from "../recovery.mjs";

/**
 * Browser thrash policy.
 *
 * Controls browser verification cost with three deterministic limits:
 * - screenshot nudge on the first screenshot command
 * - circuit breaker after 6 consecutive browser calls
 * - hard budget after 30 total browser calls in a run
 */
export const BROWSER_CIRCUIT_BREAKER_THRESHOLD = 6;
export const BROWSER_TOTAL_BUDGET = 30;

const SCREENSHOT_MESSAGE = [
    "[runtime-supervisor] For functional checks, prefer DOM queries over screenshots:",
    "",
    "- `pnpm exec agent-browser diff snapshot` - what changed after an action",
    "- `pnpm exec agent-browser eval --stdin <<'EOF'`",
    "  `JSON.stringify({ hasDialog: !!document.querySelector('[role=dialog]') })`",
    "  `EOF`",
    "- `pnpm exec agent-browser is visible <selector>`",
    "",
    "Reserve screenshots for visual layout verification."
].join("\n");

function totalBudgetMessage(totalCalls) {
    return formatRecoveryMessage(
        {
            policy: "browser-thrash",
            blockedTargets: [],
            blockedCommands: [],
            blockedBrowser: true,
            requiredActions: [
                "Read the relevant source before using browser tools again",
                "Make a targeted code change or run a different non-browser diagnostic"
            ],
            exitCriteria: ["one non-browser tool call occurs before the next browser command"]
        },
        [`browser call budget exceeded (${totalCalls}/${BROWSER_TOTAL_BUDGET})`]
    );
}

function circuitBreakerMessage(consecutiveCalls) {
    return formatRecoveryMessage(
        {
            policy: "browser-thrash",
            blockedTargets: [],
            blockedCommands: [],
            blockedBrowser: true,
            requiredActions: [
                "Check for errors with `pnpm exec agent-browser errors`",
                "Check what changed with `pnpm exec agent-browser diff snapshot`",
                "Re-read the source or logs before retrying browser automation"
            ],
            exitCriteria: ["one non-browser tool call occurs before the next browser command"]
        },
        [`${consecutiveCalls} consecutive browser calls - likely a debugging spiral`]
    );
}

export default function checkBrowserThrash(event, state) {
    if (event.toolName !== "Bash" || !event.isBrowserCommand) {
        return null;
    }

    if (state.browser.totalCalls > BROWSER_TOTAL_BUDGET) {
        return { action: "block", severity: "block", reason: totalBudgetMessage(state.browser.totalCalls) };
    }

    if (state.browser.consecutiveCalls >= BROWSER_CIRCUIT_BREAKER_THRESHOLD) {
        return { action: "block", severity: "block", reason: circuitBreakerMessage(state.browser.consecutiveCalls) };
    }

    if (event.isScreenshotCommand && !state.browser.screenshotNudgeFired) {
        state.browser.screenshotNudgeFired = true;
        return { action: "block", severity: "nudge", reason: SCREENSHOT_MESSAGE };
    }

    return null;
}
