/** Full monorepo lint via turbo (oxlint + oxfmt --check + typecheck + syncpack + knip). */

import { run } from "./utils.js";

export async function lintCheck(cwd: string): Promise<string[]> {
    const result = await run(cwd, "pnpm lint");
    if (!result.ok) {
        return [`[lint] Lint failed:\n${result.stdout}${result.stderr}`];
    }
    return [];
}
