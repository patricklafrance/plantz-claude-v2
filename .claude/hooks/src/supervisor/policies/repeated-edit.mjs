import { RECOVERY_DIAGNOSIS_PATH } from "../utils.mjs";

/**
 * Repeated edit policy.
 *
 * Detects churn on the same file and forces a diagnosis/reset before more edits.
 * Threshold: block on the 6th Edit/Write to the same file within the last 12 events.
 */
export const REPEATED_EDIT_THRESHOLD = 6;

export default function checkRepeatedEdit(event, state) {
    if (event.toolName !== "Edit" && event.toolName !== "Write") {
        return null;
    }

    if (!event.targetPath || event.targetPath === RECOVERY_DIAGNOSIS_PATH) {
        return null;
    }

    const edits = state.repeatedEdit.byFile[event.targetPath] ?? [];
    if (edits.length < REPEATED_EDIT_THRESHOLD) {
        return null;
    }

    return {
        action: "block",
        severity: "block",
        reason: [
            `[runtime-supervisor] Repeated edit loop detected for ${event.targetPath}.`,
            "",
            "Observed:",
            `- ${edits.length} edits to the same file in the last 12 events`,
            "- no broader strategy change detected",
            "",
            "Recovery required:",
            "1. Read the latest failing output or relevant source",
            "2. Update .adlc/supervisor-recovery.md with diagnosis and one new strategy",
            "3. Use one different command before editing this file again",
            "",
            "Blocked until recovery completes:",
            `- Edit/Write on ${event.targetPath}`,
            "",
            "Exit criteria:",
            "- .adlc/supervisor-recovery.md updated",
            "- next Bash command differs from the repeated command"
        ].join("\n"),
        recovery: {
            policy: "repeated-edit",
            blockedTargets: [event.targetPath],
            blockedCommands: state.toolThrash.lastCommandFingerprint ? [state.toolThrash.lastCommandFingerprint] : [],
            requiredActions: [
                "Read the latest failing output or relevant source",
                "Update .adlc/supervisor-recovery.md with diagnosis and one new strategy",
                "Use one different command before editing the churned file again"
            ],
            exitCriteria: [".adlc/supervisor-recovery.md updated", "next Bash command differs from the repeated command"],
            progress: {
                diagnosisUpdated: false,
                alternateCommandUsed: false
            }
        }
    };
}
