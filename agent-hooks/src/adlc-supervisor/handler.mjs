// pre-tool and post-tool together form one supervision loop:
// handlePreTool decides (can block), handlePostTool records evidence that informs the next decision.

import { applyEvent, createPostToolContext, createPreToolContext, persistContext, persistPostToolContext } from "./context.mjs";
import checkBrowserThrash from "./policies/browser-thrash.mjs";
import {
    checkInstallGate,
    clearExpiredInstallBypass,
    consumeInstallBypass,
    findInstallBypassData,
    hasManifestDiff,
    isInstallCommand,
    readInstallOverride
} from "./policies/install-gate.mjs";
import checkTestThrash from "./policies/test-thrash.mjs";
import checkWallClock from "./policies/wall-clock.mjs";

const preToolChecks = [
    context => {
        const result = checkBrowserThrash(context.event, context.nextState);
        if (result?.severity === "nudge") {
            context.nextState.browser.screenshotNudgeFired = true;
        }
        if (result?.severity === "recovery") {
            context.nextState.browser.recoveryTier = result.tier;
            context.nextState.browser.nonBrowserSinceRecovery = 0;
            // Clear the rolling window so stale browser events don't
            // immediately re-trigger density after the gate is cleared.
            context.nextState.recentEvents = [];
        }
        if (result?.severity === "gate") {
            // Gate-blocked calls never reach the browser — undo the
            // browser counters that applyEventToState already set so
            // blocked retries don't burn the total budget or pollute
            // the density window.
            context.nextState.browser.totalCalls -= 1;
            context.nextState.browser.consecutiveCalls -= 1;
            context.nextState.recentEvents = context.nextState.recentEvents.filter(e => e.index !== context.event.index);
        }
        return result;
    },
    context => {
        const result = checkTestThrash(context.event, context.nextState);
        if (result?.severity === "recovery") {
            context.nextState.test.recoveryTier = result.tier;
            context.nextState.test.editsSinceRecovery = 0;
        }
        if (result?.severity === "gate") {
            // Gate-blocked calls never reach the test runner — undo the
            // test counters that applyEventToState already set so
            // blocked retries don't burn the total budget.
            context.nextState.test.totalCalls -= 1;
            context.nextState.test.consecutiveWithoutEdit -= 1;
            context.nextState.recentEvents = context.nextState.recentEvents.filter(e => e.index !== context.event.index);
        }
        return result;
    }
];

export function handlePreTool(toolName, toolInput, cwd, input = {}) {
    const context = createPreToolContext(toolName, toolInput, cwd, input);
    applyEvent(context);

    // Wall-clock check runs first — if the agent has been running too long, nothing else matters.
    let result = checkWallClock(context.event, context.nextState);
    if (result?.severity === "nudge") {
        context.nextState.wallClock.nudgeFired = true;
    }

    if (!result) {
        // install-gate is handled here rather than in preToolChecks because it requires
        // pre-fetched I/O (hasManifestDiff, readInstallOverride) and post-decision state
        // mutations (consumeInstallBypass) that don't fit the pure `context => result` shape.
        // Maintenance: clear expired bypass on every pre-tool event so it does not linger in state.
        clearExpiredInstallBypass(context.nextState, context.event.index);

        // Only invoke git/fs I/O for actual install commands to avoid overhead on every tool use.
        const isInstall = context.event.toolName === "Bash" && isInstallCommand(context.event.commandFingerprint ?? "");
        const manifestDiff = isInstall && hasManifestDiff(context.cwd);
        const overrideReason = isInstall ? readInstallOverride(context.cwd) : null;

        result = checkInstallGate(context.event, context.nextState, { manifestDiff, overrideReason });
        if (result?.outcome === "install-bypass-consumed") {
            consumeInstallBypass(context.nextState, context.event.index);
        }
    }

    if (!result) {
        for (const check of preToolChecks) {
            result = check(context);
            if (result) {
                break;
            }
        }
    }

    if (result) {
        applyDecision(context, result);
        persistContext(context);
        return normalizePublicResult(result);
    }

    context.event.outcome = "allow";
    persistContext(context);
    return { action: "allow" };
}

export function handlePostTool(toolName, toolInput, cwd, input = {}) {
    const context = createPostToolContext(toolName, toolInput, cwd, input);

    const data = findInstallBypassData(context.state, context.toolName, context.toolInput, {
        toolResponse: context.input.tool_response,
        error: context.input.error
    });

    if (data) {
        context.state.installBypass = data.bypass;
        applyPostToolDecision(context, {
            action: "allow",
            outcome: "install-bypass-granted",
            reason: data.evidence.matchedPattern,
            evidenceSource: data.evidence.source
        });
        persistPostToolContext(context);
    }

    return { action: "allow" };
}

function applyDecision(context, result) {
    context.event.outcome = result.outcome ?? result.severity ?? result.action;

    if (result.reason) {
        context.event.reason = result.reason;
    }
}

function applyPostToolDecision(context, result) {
    context.event.outcome = result.outcome ?? result.severity ?? result.action;

    if (result.reason) {
        context.event.reason = result.reason;
    }

    if (result.evidenceSource) {
        context.event.evidenceSource = result.evidenceSource;
    }
}

function normalizePublicResult(result) {
    if (result.action === "allow") {
        return { action: "allow" };
    }

    return result;
}
