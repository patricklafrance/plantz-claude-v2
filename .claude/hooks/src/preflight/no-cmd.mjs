import { splitCommandSegments, stripRtkPrefix } from "./utils.mjs";

const MESSAGE = "Blocked: use bash directly, not Windows cmd.";

export default function checkNoCmd(toolName, toolInput) {
    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        const bare = stripRtkPrefix(segment);
        if (/^cmd(?:\.exe)?(?:\s|$)/i.test(bare)) {
            return { action: "block", reason: MESSAGE };
        }
    }

    return null;
}
