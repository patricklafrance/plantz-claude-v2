import { splitCommandSegments } from "./utils.mjs";

const MESSAGE =
    "Blocked: use pnpm lint for full validation, pnpm exec turbo run typecheck for typecheck-only, or pnpm exec turbo run typecheck --filter=@package for scoped checks.";
const BARE_TYPECHECK_PATTERN = /^pnpm\s+(?:run\s+)?typecheck(?:\s|$)/;

export default function checkBareTypecheck(toolName, toolInput) {
    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        if (!BARE_TYPECHECK_PATTERN.test(segment)) {
            continue;
        }

        if (/\b--filter\b/.test(segment)) {
            continue;
        }

        return { action: "block", reason: MESSAGE };
    }

    return null;
}
