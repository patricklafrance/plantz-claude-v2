import { splitCommandSegments, stripRtkPrefix } from "./utils.mjs";

const MESSAGE =
    "Blocked: use pnpm lint for full validation, pnpm exec turbo run typecheck for typecheck-only, or pnpm exec turbo run typecheck --filter=@package for scoped checks.";
const BARE_TYPECHECK_PATTERN = /^pnpm\s+(?:run\s+)?typecheck(?:\s|$)/;

export default function checkBareTypecheck(toolName, toolInput) {
    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        const bare = stripRtkPrefix(segment);

        if (!BARE_TYPECHECK_PATTERN.test(bare)) {
            continue;
        }

        if (/\b--filter\b/.test(bare)) {
            continue;
        }

        return { action: "block", reason: MESSAGE };
    }

    return null;
}
