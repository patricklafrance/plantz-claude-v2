/** Auto-format with oxfmt (writes in place). Must run before lint. */

import { run } from "../utils.mjs";

export async function oxfmtAutofix(cwd) {
    let result = await run(cwd, "pnpm exec oxfmt --write .");

    // oxfmt has a transient race condition in its CSS import resolver that
    // surfaces as: TypeError: Cannot use 'in' operator to search for 'importer'
    // A single retry is enough to clear it.
    if (!result.ok && /Cannot use 'in' operator/.test(result.stderr || result.stdout)) {
        result = await run(cwd, "pnpm exec oxfmt --write .");
    }

    if (!result.ok) {
        return [`[oxfmt] Auto-format failed:\n${result.stderr || result.stdout}`];
    }
    return [];
}
