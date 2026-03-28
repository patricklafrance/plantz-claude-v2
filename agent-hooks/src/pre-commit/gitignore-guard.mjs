/** Block commits that un-ignore .adlc/ paths — all ADLC artifacts are ephemeral. */

import { run } from "../shared/run.mjs";

export async function gitignoreGuard(cwd) {
    const result = await run(cwd, "git diff --cached -- .gitignore");
    if (!result.ok || !result.stdout) {
        return [];
    }

    const added = result.stdout
        .split("\n")
        .filter(line => line.startsWith("+") && !line.startsWith("+++"))
        .map(line => line.slice(1).trim());

    const violations = added.filter(line => line.startsWith("!.adlc/"));

    if (violations.length > 0) {
        return [
            `[gitignore-guard] .gitignore must not un-ignore .adlc/ paths (all ADLC artifacts are ephemeral):\n${violations.map(v => `  ${v}`).join("\n")}`
        ];
    }

    return [];
}
