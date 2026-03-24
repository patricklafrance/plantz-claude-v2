/**
 * _adlc-coder handler
 *
 * Post-completion pipeline:
 *   1 — oxfmt autofix (must complete before lint)
 *   2 — lint, tests, file-disable scan, secret scan, import guard (parallel)
 *   3 — kill dev server ports (always)
 */

import { getChangedFiles } from "../utils.mjs";
import { implementationNotesCheck } from "./implementation-notes.mjs";
import { checkNoCrossBoundaryImports } from "./import-guard.mjs";
import { killPorts } from "./kill-ports.mjs";
import { lint } from "./lint.mjs";
import { noFileDisable } from "./no-file-disable.mjs";
import { noSecrets } from "./no-secrets.mjs";
import { oxfmtAutofix } from "./oxfmt-autofix.mjs";
import { storyCoverage } from "./story-coverage.mjs";
import { tests } from "./tests.mjs";

export default async function handleCoder(cwd) {
    const changedFiles = getChangedFiles(cwd);

    // Phase 1: auto-format before lint
    const formatProblems = await oxfmtAutofix(cwd);

    // Phase 2: everything else in parallel
    const results = await Promise.all([
        lint(cwd),
        tests(cwd),
        Promise.resolve(noFileDisable(cwd, changedFiles)),
        noSecrets(cwd, changedFiles),
        Promise.resolve(checkNoCrossBoundaryImports(cwd, changedFiles)),
        Promise.resolve(implementationNotesCheck(changedFiles)),
        Promise.resolve(storyCoverage(cwd, changedFiles))
    ]);

    // Phase 3: kill dev server ports regardless of outcome
    killPorts();

    return [...formatProblems, ...results.flat()];
}
