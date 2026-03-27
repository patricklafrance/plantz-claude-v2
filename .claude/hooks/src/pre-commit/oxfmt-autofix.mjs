/** Auto-format with oxfmt (writes in place) and stage changes. Must run before lint. */

import { run } from "../shared/run.mjs";

export async function oxfmtAutofix(cwd) {
    const result = await run(cwd, "pnpm exec oxfmt --write .");
    if (!result.ok) {
        return [`[oxfmt] Auto-format failed:\n${result.stderr || result.stdout}`];
    }

    // Stage formatting changes so they're included in the commit.
    await run(cwd, "git add -u");

    return [];
}
