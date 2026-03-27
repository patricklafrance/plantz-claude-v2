import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { RECENT_EVENT_WINDOW } from "./utils.mjs";

const STATE_FILE = "supervisor-state.json";

const DEFAULT_STATE = {
    agentName: null,
    eventCount: 0,
    recentEvents: [],
    browser: {
        consecutiveCalls: 0,
        totalCalls: 0,
        screenshotNudgeFired: false
    },
    repeatedEdit: {
        byFile: {}
    },
    toolThrash: {
        lastCommandFingerprint: null,
        repeatCount: 0
    },
    postEventSequence: 0,
    installBypass: null,
    policyAttempts: {}
};

function cloneDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

export function readState(cwd) {
    try {
        const raw = JSON.parse(readFileSync(resolve(cwd, ".adlc", STATE_FILE), "utf8"));
        const defaults = cloneDefaultState();

        return {
            ...defaults,
            ...raw,
            browser: { ...defaults.browser, ...raw.browser },
            repeatedEdit: { ...defaults.repeatedEdit, ...raw.repeatedEdit, byFile: { ...defaults.repeatedEdit.byFile, ...raw.repeatedEdit?.byFile } },
            toolThrash: { ...defaults.toolThrash, ...raw.toolThrash },
            postEventSequence: raw.postEventSequence ?? defaults.postEventSequence,
            installBypass: raw.installBypass ?? defaults.installBypass,
            policyAttempts: { ...defaults.policyAttempts, ...raw.policyAttempts }
        };
    } catch {
        return cloneDefaultState();
    }
}

export function writeState(cwd, state) {
    const dir = resolve(cwd, ".adlc");
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, STATE_FILE), JSON.stringify(state, null, 4) + "\n");
}

export function applyEventToState(state, event) {
    state.eventCount = event.index;
    state.postEventSequence = 0;
    state.recentEvents.push({
        index: event.index,
        timestamp: event.timestamp,
        toolName: event.toolName,
        targetPath: event.targetPath,
        commandFingerprint: event.commandFingerprint,
        isBrowserCommand: event.isBrowserCommand,
        isScreenshotCommand: event.isScreenshotCommand
    });
    state.recentEvents = state.recentEvents.filter(item => item.index > event.index - RECENT_EVENT_WINDOW);

    if (event.toolName !== "Bash" || !event.isBrowserCommand) {
        state.browser.consecutiveCalls = 0;
    }

    if (event.toolName === "Bash") {
        if (event.isBrowserCommand) {
            state.browser.consecutiveCalls += 1;
            state.browser.totalCalls += 1;
        }

        if (event.commandFingerprint) {
            if (event.commandFingerprint === state.toolThrash.lastCommandFingerprint) {
                state.toolThrash.repeatCount += 1;
            } else {
                state.toolThrash.lastCommandFingerprint = event.commandFingerprint;
                state.toolThrash.repeatCount = 1;
            }
        }
    }

    if (event.toolName === "Edit" || event.toolName === "Write") {
        if (event.targetPath) {
            const history = state.repeatedEdit.byFile[event.targetPath] ?? [];
            state.repeatedEdit.byFile[event.targetPath] = [...history, event.index].filter(index => index > event.index - RECENT_EVENT_WINDOW);
        }

        state.toolThrash.lastCommandFingerprint = null;
        state.toolThrash.repeatCount = 0;
    }

    for (const [filePath, indexes] of Object.entries(state.repeatedEdit.byFile)) {
        const recent = indexes.filter(index => index > event.index - RECENT_EVENT_WINDOW);
        if (recent.length === 0) {
            delete state.repeatedEdit.byFile[filePath];
            continue;
        }

        state.repeatedEdit.byFile[filePath] = recent;
    }

    return state;
}
