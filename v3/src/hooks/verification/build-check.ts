/** Full monorepo build via turbo. */

import { run } from "./utils.js";

export async function buildCheck(cwd: string): Promise<string[]> {
    const result = await run(cwd, "pnpm exec turbo run build");
    if (!result.ok) {
        return [`[build] Build failed:\n${result.stdout}${result.stderr}`];
    }
    return [];
}
