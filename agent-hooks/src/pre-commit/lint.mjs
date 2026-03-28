/** Full monorepo lint via turbo (oxlint + oxfmt --check + typecheck + syncpack + knip). */

import { run } from "../shared/run.mjs";

export async function lint(cwd) {
    const result = await run(cwd, "pnpm lint");
    if (!result.ok) {
        return [`[lint] Lint failed:\n${result.stdout}${result.stderr}`];
    }
    return [];
}
