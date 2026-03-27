import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { RECOVERY_DIAGNOSIS_PATH, normalizePath } from "./utils.mjs";

const RECOVERY_FILE = "supervisor-recovery.json";

export function readRecovery(cwd) {
    try {
        return JSON.parse(readFileSync(resolve(cwd, ".adlc", RECOVERY_FILE), "utf8"));
    } catch {
        return null;
    }
}

export function writeRecovery(cwd, recovery) {
    const dir = resolve(cwd, ".adlc");
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, RECOVERY_FILE), JSON.stringify(recovery, null, 4) + "\n");
}

export function clearRecovery(cwd) {
    try {
        rmSync(resolve(cwd, ".adlc", RECOVERY_FILE));
    } catch {
        // Missing file is fine.
    }
}

export function createRecovery(state, event, spec) {
    const attempt = (state.policyAttempts[spec.policy] ?? 0) + 1;
    state.policyAttempts[spec.policy] = attempt;

    return {
        active: true,
        policy: spec.policy,
        triggeredAt: event.timestamp,
        triggerEventIndex: event.index,
        attempt,
        maxAttempts: spec.maxAttempts ?? 2,
        blockedTargets: (spec.blockedTargets ?? []).map(normalizePath),
        blockedCommands: spec.blockedCommands ?? [],
        blockedBrowser: spec.blockedBrowser ?? false,
        requiredActions: spec.requiredActions ?? [],
        exitCriteria: spec.exitCriteria ?? [],
        status: "active",
        progress: { ...(spec.progress ?? {}) }
    };
}

export function formatRecoveryMessage(recovery, details = []) {
    const lines = [`[runtime-supervisor] ${recovery.policy} recovery is active.`, ""];

    if (details.length > 0) {
        lines.push("Observed:");
        lines.push(...details.map(detail => `- ${detail}`));
        lines.push("");
    }

    if (recovery.requiredActions.length > 0) {
        lines.push("Recovery required:");
        lines.push(...recovery.requiredActions.map((step, index) => `${index + 1}. ${step}`));
        lines.push("");
    }

    const blocked = [];
    if (recovery.blockedTargets.length > 0) {
        blocked.push(...recovery.blockedTargets.map(target => `Edit/Write on ${target}`));
    }
    if (recovery.blockedCommands.length > 0) {
        blocked.push(...recovery.blockedCommands.map(command => `Bash command matching: ${command}`));
    }
    if (recovery.blockedBrowser) {
        blocked.push("Browser Bash commands");
    }

    if (blocked.length > 0) {
        lines.push("Blocked until recovery completes:");
        lines.push(...blocked.map(item => `- ${item}`));
        lines.push("");
    }

    if (recovery.exitCriteria.length > 0) {
        lines.push("Exit criteria:");
        lines.push(...recovery.exitCriteria.map(item => `- ${item}`));
    }

    return lines.join("\n").trim();
}

export function applyRecoveryProgress(recovery, event) {
    const diagnosisPath = normalizePath(RECOVERY_DIAGNOSIS_PATH);
    const targetPath = normalizePath(event.targetPath);

    if ((event.toolName === "Write" || event.toolName === "Edit") && targetPath === diagnosisPath) {
        recovery.progress.diagnosisUpdated = true;
    }

    if (event.toolName === "Read") {
        recovery.progress.relevantReadSeen = true;
    }

    if (event.toolName === "Bash" && event.commandFingerprint && !recovery.blockedCommands.includes(event.commandFingerprint)) {
        recovery.progress.alternateCommandUsed = true;
    }

    return recovery;
}

export function isRecoveryComplete(recovery) {
    if (recovery.policy === "repeated-edit") {
        return Boolean(recovery.progress.diagnosisUpdated && recovery.progress.alternateCommandUsed);
    }

    if (recovery.policy === "tool-call-thrash") {
        return Boolean(recovery.progress.relevantReadSeen || recovery.progress.alternateCommandUsed);
    }

    return false;
}

export function resetStateAfterRecovery(state, recovery) {
    if (recovery.policy === "repeated-edit") {
        for (const target of recovery.blockedTargets) {
            delete state.repeatedEdit.byFile[target];
        }

        state.toolThrash.lastCommandFingerprint = null;
        state.toolThrash.repeatCount = 0;
        return state;
    }

    if (recovery.policy === "tool-call-thrash") {
        state.toolThrash.lastCommandFingerprint = null;
        state.toolThrash.repeatCount = 0;
        return state;
    }

    return state;
}

export function enforceRecovery(event, recovery) {
    const targetPath = normalizePath(event.targetPath);
    const diagnosisPath = normalizePath(RECOVERY_DIAGNOSIS_PATH);

    if (recovery.blockedBrowser && event.toolName === "Bash" && event.isBrowserCommand) {
        return { action: "block", severity: "block", reason: formatRecoveryMessage(recovery) };
    }

    if ((event.toolName === "Edit" || event.toolName === "Write") && recovery.blockedTargets.includes(targetPath) && targetPath !== diagnosisPath) {
        return { action: "block", severity: "block", reason: formatRecoveryMessage(recovery) };
    }

    if (event.toolName === "Bash" && event.commandFingerprint && recovery.blockedCommands.includes(event.commandFingerprint)) {
        return { action: "block", severity: "block", reason: formatRecoveryMessage(recovery) };
    }

    return null;
}

export function clearRecoveryArtifacts(cwd) {
    clearRecovery(cwd);

    const diagnosisFile = resolve(cwd, RECOVERY_DIAGNOSIS_PATH);
    if (existsSync(diagnosisFile)) {
        rmSync(diagnosisFile);
    }
}
