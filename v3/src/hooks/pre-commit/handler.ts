/**
 * Pre-commit handler
 *
 * Pipeline:
 *   1 — format autofix + stage changes (must complete before lint)
 *   2 — build, lint, tests, gitignore guard (parallel)
 */

import { buildCheck } from "./build-check.js";
import { formatAutofix } from "./format-autofix.js";
import { gitignoreGuard } from "./gitignore-guard.js";
import { lintCheck } from "./lint-check.js";
import { testsCheck } from "./tests-check.js";

export async function handlePreCommit(cwd: string): Promise<string[]> {
    // Phase 1: auto-format and stage before lint
    const formatProblems = await formatAutofix(cwd);

    // Phase 2: build + lint + tests + gitignore guard in parallel
    const results = await Promise.all([buildCheck(cwd), lintCheck(cwd), testsCheck(cwd), gitignoreGuard(cwd)]);

    return [...formatProblems, ...results.flat()];
}
