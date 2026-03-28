/** Full monorepo build via turbo. */

import { run } from "../utils.mjs";

export async function build(cwd) {
    const result = await run(cwd, "pnpm exec turbo run build");
    if (!result.ok) {
        return [`[build] Build failed:\n${result.stdout}${result.stderr}`];
    }
    return [];
}
