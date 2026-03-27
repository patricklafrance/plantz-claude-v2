import { execFileSync } from "node:child_process";

/**
 * Rewrites supported commands through `rtk` for token-compressed output.
 *
 * Returns null when:
 * - the command is empty
 * - the command is already prefixed with `rtk`
 * - the command contains a heredoc
 * - `rtk` is not installed
 * - `rtk rewrite` does not support the command
 */
export function rewriteWithRtk(command, env = process.env) {
    const candidate = String(command ?? "");

    if (!candidate.trim()) {
        return null;
    }

    if (candidate.startsWith("rtk ")) {
        return null;
    }

    if (candidate.includes("<<")) {
        return null;
    }

    try {
        const rewritten = execFileSync("rtk", ["rewrite", candidate], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 15_000,
            env
        }).trim();

        return rewritten || null;
    } catch {
        return null;
    }
}
