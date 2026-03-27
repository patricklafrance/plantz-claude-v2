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
import checkRepeatedEdit from "./policies/repeated-edit.mjs";
import checkToolCallThrash from "./policies/tool-call-thrash.mjs";
import {
    applyRecoveryProgress,
    createRecovery,
    enforceRecovery,
    formatRecoveryMessage,
    isRecoveryComplete,
    resetStateAfterRecovery
} from "./recovery.mjs";

const preToolChecks = [
    context => {
        const result = checkBrowserThrash(context.event, context.nextState);
        if (result?.severity === "nudge") {
            context.nextState.browser.screenshotNudgeFired = true;
        }
        return result;
    },
    context => checkRepeatedEdit(context.event, context.nextState),
    context => checkToolCallThrash(context.event, context.nextState)
];

export function handlePreTool(toolName, toolInput, cwd, input = {}) {
    const context = createPreToolContext(toolName, toolInput, cwd, input);
    applyEvent(context);

    let result = runRecoveryGate(context);

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
        result = advanceRecovery(context);
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
        const finalResult = applyDecision(context, result);
        persistContext(context);
        return normalizePublicResult(finalResult);
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

// Recovery pipeline steps — these are orchestration (coordinate context + domain calls)
// and belong here, not in recovery.mjs which owns the domain logic.
function runRecoveryGate(context) {
    if (!context.recovery?.active) {
        return null;
    }

    return enforceRecovery(context.event, context.recovery) ?? null;
}

function advanceRecovery(context) {
    if (!context.recovery?.active) {
        return null;
    }

    context.recovery = applyRecoveryProgress(context.recovery, context.event);
    if (isRecoveryComplete(context.recovery)) {
        resetStateAfterRecovery(context.nextState, context.recovery);
        context.recovery = null;
    }

    return { action: "allow" };
}

function applyDecision(context, result) {
    context.event.outcome = result.outcome ?? result.severity ?? result.action;

    if (result.reason) {
        context.event.reason = result.reason;
    }

    if (!result.recovery) {
        return result;
    }

    const nextRecovery = createRecovery(context.nextState, context.event, result.recovery);
    if (nextRecovery.attempt > nextRecovery.maxAttempts) {
        context.event.outcome = "escalate";
        context.recovery = null;
        return {
            action: "block",
            severity: "escalate",
            reason: formatRecoveryMessage(
                {
                    policy: result.recovery.policy,
                    blockedTargets: [],
                    blockedCommands: [],
                    blockedBrowser: false,
                    requiredActions: [
                        "Hand off to a planner/reviewer role or switch strategies entirely",
                        "Request human input only if the alternative strategy is unclear"
                    ],
                    exitCriteria: ["a different role or strategy takes over"]
                },
                [`${result.recovery.policy} recovery exceeded ${nextRecovery.maxAttempts} attempts`]
            )
        };
    }

    context.recovery = nextRecovery;
    return result;
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
