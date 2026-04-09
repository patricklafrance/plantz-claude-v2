import type { PreflightResult } from "./types.js";
import { splitCommandSegments } from "./utils.js";

const MESSAGE =
    "Blocked: bare pnpm typecheck runs at the root only — no per-package checks, no caching. Use pnpm lint for full validation or scope the typecheck to a specific package.";
const BARE_TYPECHECK_PATTERN = /^pnpm\s+(?:run\s+)?typecheck(?:\s|$)/;

export default function checkBlockBareTypecheck(toolName: string, toolInput: Record<string, unknown>): PreflightResult | null {
    if (toolName !== "Bash") {
        return null;
    }

    const command = (toolInput?.command as string) ?? "";

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
