/** Auto-format with oxfmt (writes in place) and stage changes. Must run before lint. */

import { run } from "../post-agent-checks/utils.js";

export async function oxfmtAutofix(cwd: string): Promise<string[]> {
    let result = await run(cwd, "pnpm oxfmt-auto-fix");

    // oxfmt has a transient race condition in its CSS import resolver that
    // surfaces as: TypeError: Cannot use 'in' operator to search for 'importer'
    // A single retry is enough to clear it.
    if (!result.ok && /Cannot use 'in' operator/.test(result.stderr || result.stdout)) {
        result = await run(cwd, "pnpm oxfmt-auto-fix");
    }

    if (!result.ok) {
        return [`[oxfmt] Auto-format failed:\n${result.stderr || result.stdout}`];
    }

    // Stage formatting changes so they're included in the commit.
    await run(cwd, "git add -u");

    return [];
}
