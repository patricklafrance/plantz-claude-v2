/**
 * Pre-commit handler
 *
 * Pipeline:
 *   1 — format-fix → lint-fix → stage changes (sequential, must complete before checks)
 *   2 — build, lint, tests, gitignore guard (parallel)
 */

import { buildCheck } from "./build-check.js";
import { formatFix } from "./format-fix.js";
import { gitignoreGuard } from "./gitignore-guard.js";
import { lintFix } from "./lint-fix.js";
import { lintCheck } from "./lint-check.js";
import { testsCheck } from "./tests-check.js";

export async function handlePreCommit(cwd: string): Promise<string[]> {
    // Phase 1: autofix — format first, then lint-fix (sequential to avoid conflicts)
    const formatProblems = await formatFix(cwd);
    const lintFixProblems = await lintFix(cwd);

    // Phase 2: build + lint (check-only, catches unfixable issues) + tests + gitignore guard in parallel
    const results = await Promise.all([buildCheck(cwd), lintCheck(cwd), testsCheck(cwd), gitignoreGuard(cwd)]);

    return [...formatProblems, ...lintFixProblems, ...results.flat()];
}
