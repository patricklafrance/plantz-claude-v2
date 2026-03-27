/**
 * Tool-call thrash policy.
 *
 * Detects repeated identical Bash commands without strategy change.
 * Threshold: block on the 3rd identical command in a row unless an Edit/Write resets the sequence.
 */
// Block after 3 identical Bash commands with no intervening edit. Two retries are
// reasonable (transient failure, timing); a third signals the agent is stuck expecting
// different output from the same command.
export const TOOL_THRASH_THRESHOLD = 3;

export default function checkToolCallThrash(event, state) {
    if (event.toolName !== "Bash" || !event.commandFingerprint) {
        return null;
    }

    if (event.isBrowserCommand) {
        return null;
    }

    if (state.toolThrash.repeatCount < TOOL_THRASH_THRESHOLD) {
        return null;
    }

    return {
        action: "block",
        severity: "block",
        reason: [
            `[runtime-supervisor] Repeated command thrash detected for \`${event.commandFingerprint}\`.`,
            "",
            "Observed:",
            `- same Bash command repeated ${state.toolThrash.repeatCount} times`,
            "- no intervening edit or materially different command",
            "",
            "Recovery required:",
            "1. Read the relevant source or latest tool output",
            "2. Choose a different diagnostic command or strategy",
            "",
            "Blocked until recovery completes:",
            `- Bash command matching: ${event.commandFingerprint}`,
            "",
            "Exit criteria:",
            "- a relevant Read occurs",
            "- or a different Bash command is used"
        ].join("\n"),
        recovery: {
            policy: "tool-call-thrash",
            blockedCommands: [event.commandFingerprint],
            requiredActions: ["Read the relevant source or latest tool output", "Choose a different diagnostic command or strategy"],
            exitCriteria: ["a relevant Read occurs", "or a different Bash command is used"],
            progress: {
                relevantReadSeen: false,
                alternateCommandUsed: false
            }
        }
    };
}
