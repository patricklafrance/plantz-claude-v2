/** Auto-format with oxfmt (writes in place). Must run before lint. */

import { run } from "../utils.mjs";

export async function oxfmtAutofix(cwd) {
    const result = await run(cwd, "pnpm exec oxfmt --write .");
    if (!result.ok) {
        return [`[oxfmt] Auto-format failed:\n${result.stderr || result.stdout}`];
    }
    return [];
}
