/**
 * _adlc-simplify handler
 *
 * Post-completion pipeline:
 *   1 — oxfmt autofix (must complete before lint)
 *   2 — build, lint, tests, file-disable scan, import guard (parallel)
 */

import { build } from "../shared/build.mjs";
import { checkNoCrossBoundaryImports } from "../shared/import-guard.mjs";
import { lint } from "../shared/lint.mjs";
import { noFileDisable } from "../shared/no-file-disable.mjs";
import { oxfmtAutofix } from "../shared/oxfmt-autofix.mjs";
import { tests } from "../shared/tests.mjs";
import { getChangedFiles } from "../utils.mjs";

export default async function handleSimplify(cwd) {
    const changedFiles = getChangedFiles(cwd);

    // Phase 1: auto-format before lint
    const formatProblems = await oxfmtAutofix(cwd);

    // Phase 2: everything else in parallel
    const results = await Promise.all([
        build(cwd),
        lint(cwd),
        tests(cwd),
        Promise.resolve(noFileDisable(cwd, changedFiles)),
        Promise.resolve(checkNoCrossBoundaryImports(cwd, changedFiles))
    ]);

    return [...formatProblems, ...results.flat()];
}
