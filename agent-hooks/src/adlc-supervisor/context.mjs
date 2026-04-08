import { appendEvent } from "./events.mjs";
import { applyEventToState, readState, writeState } from "./state.mjs";
import { extractBrowserTarget, fingerprintCommand, getTargetPath, isBrowserCommand, isScreenshotCommand, isTestCommand } from "./utils.mjs";

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
        isTestCommand: toolName === "Bash" ? isTestCommand(command) : false,
        browserTarget: toolName === "Bash" ? extractBrowserTarget(command) : null,
        index: state.eventCount + 1
    };
}

export function createPreToolContext(toolName, toolInput, cwd, input = {}) {
    const state = readState(cwd);
    const nextState = JSON.parse(JSON.stringify(state));
    const event = normalizeEvent(toolName, toolInput, state, input);

    return {
        cwd,
        input,
        toolName,
        toolInput,
        state,
        nextState,
        event
    };
}

export function persistContext(context, state = context.nextState) {
    writeState(context.cwd, state);
    appendEvent(context.cwd, context.event);
}

export function applyEvent(context) {
    applyEventToState(context.nextState, context.event);
    return context;
}

export function createPostToolContext(toolName, toolInput, cwd, input = {}) {
    const state = readState(cwd);
    const command = toolName === "Bash" ? String(toolInput?.command ?? "") : "";
    // PostToolUse/PostToolUseFailure events need stable ordering in the JSONL log
    // without consuming the main pre-tool event counter, so they use fractional
    // indexes after the latest pre-tool event: 3, 3.001, 3.002, 4, ...
    const index = state.eventCount + (state.postEventSequence + 1) / 1000;

    return {
        cwd,
        input,
        toolName,
        toolInput,
        state,
        event: {
            timestamp: new Date().toISOString(),
            agentName: input.agent_type ?? input.agent_name ?? null,
            toolName,
            toolSignature: toolName === "Bash" ? `${toolName}:${fingerprintCommand(command)}` : `${toolName}:${getTargetPath(toolName, toolInput)}`,
            targetPath: getTargetPath(toolName, toolInput),
            commandFingerprint: toolName === "Bash" ? fingerprintCommand(command) : null,
            isBrowserCommand: toolName === "Bash" ? isBrowserCommand(command) : false,
            isScreenshotCommand: toolName === "Bash" ? isScreenshotCommand(command) : false,
            isTestCommand: toolName === "Bash" ? isTestCommand(command) : false,
            browserTarget: toolName === "Bash" ? extractBrowserTarget(command) : null,
            index,
            phase: input.hook_event_name ?? input.hook_event_name_override ?? "PostToolUse"
        }
    };
}

export function persistPostToolContext(context) {
    context.state.postEventSequence += 1;
    writeState(context.cwd, context.state);
    appendEvent(context.cwd, context.event);
}
