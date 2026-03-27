import { splitCommandSegments, stripRtkPrefix } from "./utils.mjs";

const MESSAGE = "Blocked: use pnpm lint for full validation or pnpm --filter @package typecheck for scoped checks.";

export default function checkBareTypecheck(toolName, toolInput) {
    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        const bare = stripRtkPrefix(segment);

        if (!/^pnpm(?:\s|$)/.test(bare)) {
            continue;
        }

        if (!/\btypecheck\b/.test(bare)) {
            continue;
        }

        if (/\b--filter\b/.test(bare)) {
            continue;
        }

        if (/^pnpm\s+typecheck(?:\s|$)/.test(bare)) {
            return { action: "block", reason: MESSAGE };
        }
    }

    return null;
}
