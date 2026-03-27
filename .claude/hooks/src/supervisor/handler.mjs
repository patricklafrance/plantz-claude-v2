import { applyEvent, createPostToolContext, createPreToolContext, persistContext, persistPostToolContext } from "./context.mjs";
import handleInstallEvidence from "./post-tool-handlers/install-evidence.mjs";
import handleBrowserThrash from "./pre-tool-handlers/browser-thrash.mjs";
import handleInstallGate from "./pre-tool-handlers/install-gate.mjs";
import handleRecoveryGate, { finalizeRecovery } from "./pre-tool-handlers/recovery.mjs";
import handleRepeatedEdit from "./pre-tool-handlers/repeated-edit.mjs";
import handleToolCallThrash from "./pre-tool-handlers/tool-call-thrash.mjs";
import { createRecovery, formatRecoveryMessage } from "./recovery.mjs";
const preToolChecks = [handleBrowserThrash, handleRepeatedEdit, handleToolCallThrash];

export function evaluate(toolName, toolInput, cwd, input = {}) {
    const context = createPreToolContext(toolName, toolInput, cwd, input);
    applyEvent(context);

    let result = handleRecoveryGate(context);
    if (!result) {
        result = handleInstallGate(context);
    }

    if (!result) {
        result = finalizeRecovery(context);
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

export function recordToolResult(toolName, toolInput, cwd, input = {}) {
    const context = createPostToolContext(toolName, toolInput, cwd, input);
    const result = handleInstallEvidence(context);
    if (result) {
        applyPostToolDecision(context, result);
        persistPostToolContext(context);
        return { action: "allow" };
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
