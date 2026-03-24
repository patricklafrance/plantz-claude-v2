/**
 * Pre-commit handler
 *
 * Pipeline:
 *   1 — oxfmt autofix + stage changes (must complete before lint)
 *   2 — lint, tests (parallel)
 */

import { lint } from "./lint.mjs";
import { oxfmtAutofix } from "./oxfmt-autofix.mjs";
import { tests } from "./tests.mjs";

export default async function handlePreCommit(cwd) {
    // Phase 1: auto-format and stage before lint
    const formatProblems = await oxfmtAutofix(cwd);

    // Phase 2: lint + tests in parallel
    const results = await Promise.all([lint(cwd), tests(cwd)]);

    return [...formatProblems, ...results.flat()];
}
