import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STATE_FILE = "supervisor-state.json";

const DEFAULT_STATE = {
    agentName: null,
    eventCount: 0,
    recentEvents: [],
    browser: {
        totalCalls: 0,
        screenshotNudgeFired: false,
        recoveryTier: 0,
        nonBrowserSinceRecovery: 0,
        currentTarget: null,
        sameTargetCalls: 0
    },
    test: {
        consecutiveWithoutEdit: 0,
        totalCalls: 0,
        recoveryTier: 0,
        editsSinceRecovery: 0
    },
    startedAt: null,
    wallClock: {
        nudgeFired: false
    },
    postEventSequence: 0,
    installBypass: null
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
            test: { ...defaults.test, ...raw.test },
            wallClock: { ...defaults.wallClock, ...raw.wallClock },
            postEventSequence: raw.postEventSequence ?? defaults.postEventSequence,
            installBypass: raw.installBypass ?? defaults.installBypass
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

    if (state.startedAt == null) {
        state.startedAt = event.timestamp;
    }

    state.recentEvents.push({
        index: event.index,
        timestamp: event.timestamp,
        toolName: event.toolName,
        targetPath: event.targetPath,
        commandFingerprint: event.commandFingerprint,
        isBrowserCommand: event.isBrowserCommand,
        isScreenshotCommand: event.isScreenshotCommand,
        isTestCommand: event.isTestCommand
    });

    // Keep only the most recent events for rolling-window policies.
    const RECENT_EVENT_WINDOW = 12;
    state.recentEvents = state.recentEvents.filter(item => item.index > event.index - RECENT_EVENT_WINDOW);

    if (event.toolName !== "Bash" || !event.isBrowserCommand) {
        state.browser.nonBrowserSinceRecovery += 1;
    }

    if (event.toolName === "Bash" && event.isBrowserCommand) {
        state.browser.totalCalls += 1;

        // Repetition tracking: count browser commands on the same page.
        if (event.browserTarget != null) {
            // "open" command — new page or same page revisited.
            if (event.browserTarget !== state.browser.currentTarget) {
                state.browser.currentTarget = event.browserTarget;
                state.browser.sameTargetCalls = 1;
            } else {
                state.browser.sameTargetCalls += 1;
            }
        } else {
            // Non-open browser command (eval, screenshot, etc.) — stays on current page.
            state.browser.sameTargetCalls += 1;
        }
    }

    // Edit/Write means the agent is making progress — reset repetition counter.
    if (event.toolName === "Edit" || event.toolName === "Write") {
        state.browser.sameTargetCalls = 0;
        state.test.consecutiveWithoutEdit = 0;
        state.test.editsSinceRecovery += 1;
    }

    if (event.toolName === "Bash" && event.isTestCommand) {
        state.test.consecutiveWithoutEdit += 1;
        state.test.totalCalls += 1;
    }

    return state;
}
