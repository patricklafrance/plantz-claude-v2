/**
 * simplify handler
 *
 * Post-completion pipeline:
 *   1 -- oxfmt autofix (must complete before lint)
 *   2 -- build, lint, tests, file-disable scan, import guard (parallel)
 */

import { buildCheck } from "../build-check.js";
import { crossBoundaryImportsCheck } from "../import-guard-check.js";
import { lintCheck } from "../lint-check.js";
import { noFileDisableCheck } from "../no-file-disable-check.js";
import { oxfmtAutofix } from "../oxfmt-autofix.js";
import { testsCheck } from "../tests-check.js";
import { getChangedFiles } from "../utils.js";

export async function handleSimplify(cwd: string): Promise<string[]> {
    const changedFiles = getChangedFiles(cwd);

    // Phase 1: auto-format before lint
    const formatProblems = await oxfmtAutofix(cwd);

    // Phase 2: everything else in parallel
    const results = await Promise.all([
        buildCheck(cwd),
        lintCheck(cwd),
        testsCheck(cwd),
        Promise.resolve(noFileDisableCheck(cwd, changedFiles)),
        Promise.resolve(crossBoundaryImportsCheck(cwd, changedFiles))
    ]);

    return [...formatProblems, ...results.flat()];
}
