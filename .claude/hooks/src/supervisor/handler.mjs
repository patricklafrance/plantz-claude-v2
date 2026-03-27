import { appendEvent } from "./events.mjs";
import checkBrowserThrash from "./policies/browser-thrash.mjs";
import checkRepeatedEdit from "./policies/repeated-edit.mjs";
import checkToolCallThrash from "./policies/tool-call-thrash.mjs";
import {
    applyRecoveryProgress,
    clearRecovery,
    createRecovery,
    enforceRecovery,
    formatRecoveryMessage,
    isRecoveryComplete,
    readRecovery,
    resetStateAfterRecovery,
    writeRecovery
} from "./recovery.mjs";
import { applyEventToState, readState, writeState } from "./state.mjs";
import { fingerprintCommand, getTargetPath, isBrowserCommand, isScreenshotCommand } from "./utils.mjs";

const checks = [checkBrowserThrash, checkRepeatedEdit, checkToolCallThrash];

function normalizeEvent(toolName, toolInput, state, input) {
    const command = toolName === "Bash" ? String(toolInput?.command ?? "") : "";

    return {
        timestamp: new Date().toISOString(),
        agentName: input.agent_type ?? input.agent_name ?? null,
        toolName,
        toolSignature: toolName === "Bash" ? `${toolName}:${fingerprintCommand(command)}` : `${toolName}:${getTargetPath(toolName, toolInput)}`,
        targetPath: getTargetPath(toolName, toolInput),
        commandFingerprint: toolName === "Bash" ? fingerprintCommand(command) : null,
        isBrowserCommand: toolName === "Bash" ? isBrowserCommand(command) : false,
        isScreenshotCommand: toolName === "Bash" ? isScreenshotCommand(command) : false,
        index: state.eventCount + 1
    };
}

function persist(cwd, state, event, recovery) {
    writeState(cwd, state);
    appendEvent(cwd, event);

    if (recovery?.active) {
        writeRecovery(cwd, recovery);
    } else {
        clearRecovery(cwd);
    }
}

export function evaluate(toolName, toolInput, cwd, input = {}) {
    const state = readState(cwd);
    const nextState = JSON.parse(JSON.stringify(state));
    const event = normalizeEvent(toolName, toolInput, state, input);
    let recovery = readRecovery(cwd);

    applyEventToState(nextState, event);

    if (recovery?.active) {
        const recoveryBlock = enforceRecovery(event, recovery);
        if (recoveryBlock) {
            event.outcome = recoveryBlock.severity ?? recoveryBlock.action;
            persist(cwd, state, event, recovery);
            return recoveryBlock;
        }

        recovery = applyRecoveryProgress(recovery, event);
        if (isRecoveryComplete(recovery)) {
            resetStateAfterRecovery(nextState, recovery);
            recovery = null;
        }

        event.outcome = "allow";
        persist(cwd, nextState, event, recovery);
        return { action: "allow" };
    }

    for (const check of checks) {
        const result = check(event, nextState);
        if (!result) {
            continue;
        }

        if (result.recovery) {
            const nextRecovery = createRecovery(nextState, event, result.recovery);
            if (nextRecovery.attempt > nextRecovery.maxAttempts) {
                event.outcome = "escalate";
                persist(cwd, nextState, event, null);
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

            event.outcome = result.severity ?? result.action;
            persist(cwd, nextState, event, nextRecovery);
            return result;
        }

        event.outcome = result.severity ?? result.action;
        persist(cwd, nextState, event, recovery);
        return result;
    }

    event.outcome = "allow";
    persist(cwd, nextState, event, recovery);
    return { action: "allow" };
}
