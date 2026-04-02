/**
 * Wall-clock circuit breaker policy.
 *
 * Detects agents that run too long without completing. Two tiers:
 * - Nudge (T1): blocks ONE tool call with a reflection prompt, then allows subsequent calls.
 * - Hard stop (T2): blocks ALL tool calls, forcing the agent to return to the coordinator.
 *
 * Thresholds are per-agent-type, calibrated from observed healthy run durations.
 */

const MINUTES = 60_000;

const THRESHOLDS = {
    "_adlc-coder": { nudge: null, hardStop: 30 * MINUTES },
    "_adlc-reviewer": { nudge: 10 * MINUTES, hardStop: 15 * MINUTES },
    "_adlc-explorer": { nudge: 5 * MINUTES, hardStop: 8 * MINUTES },
    "_adlc-planner": { nudge: 5 * MINUTES, hardStop: 8 * MINUTES },
    "_adlc-plan-gate": { nudge: 5 * MINUTES, hardStop: 8 * MINUTES },
    "_adlc-domain-mapper": { nudge: 5 * MINUTES, hardStop: 8 * MINUTES },
    "_adlc-pr": { nudge: 5 * MINUTES, hardStop: 8 * MINUTES },
    "_adlc-document": { nudge: 5 * MINUTES, hardStop: 8 * MINUTES },
    "_adlc-evidence-researcher": { nudge: 3 * MINUTES, hardStop: 5 * MINUTES },
    "_adlc-placement-gate": { nudge: 3 * MINUTES, hardStop: 5 * MINUTES }
};

const DEFAULT_THRESHOLD = { nudge: 10 * MINUTES, hardStop: 15 * MINUTES };

const EXEMPT_AGENTS = new Set(["_adlc-monitor"]);

export { THRESHOLDS, DEFAULT_THRESHOLD, EXEMPT_AGENTS };

function formatMinutes(ms) {
    return `${Math.round(ms / MINUTES)}`;
}

function nudgeMessage(elapsedMs) {
    return [
        `[runtime-supervisor] You have been running for ${formatMinutes(elapsedMs)} minutes.`,
        "",
        "Pause and reflect:",
        "- What is still failing?",
        "- Is your current approach converging or are you repeating variations of the same fix?",
        "- If not converging, what fundamentally different strategy could you try?",
        "",
        "Summarize your assessment, then continue."
    ].join("\n");
}

function hardStopMessage(elapsedMs) {
    return [
        `[runtime-supervisor] STOP. You have been running for ${formatMinutes(elapsedMs)} minutes without completing.`,
        "",
        "All further tool calls will be blocked. Return your current status to the coordinator immediately, including:",
        "- What you accomplished",
        "- What is still failing",
        "- What approach you were trying"
    ].join("\n");
}

export function getThresholds(agentName) {
    if (!agentName || EXEMPT_AGENTS.has(agentName)) {
        return null;
    }

    return THRESHOLDS[agentName] ?? DEFAULT_THRESHOLD;
}

/**
 * @param {object} event - normalized event with timestamp and agentName
 * @param {object} state - supervisor state with startedAt and wallClock fields
 * @returns {null | { action: string, severity?: string, reason: string }}
 */
export default function checkWallClock(event, state) {
    const thresholds = getThresholds(event.agentName);
    if (!thresholds) {
        return null;
    }

    if (!state.startedAt) {
        return null;
    }

    const elapsed = new Date(event.timestamp).getTime() - new Date(state.startedAt).getTime();

    if (elapsed >= thresholds.hardStop) {
        return {
            action: "block",
            severity: "hard-stop",
            reason: hardStopMessage(elapsed)
        };
    }

    if (thresholds.nudge != null && elapsed >= thresholds.nudge && !state.wallClock.nudgeFired) {
        return {
            action: "block",
            severity: "nudge",
            reason: nudgeMessage(elapsed)
        };
    }

    return null;
}
