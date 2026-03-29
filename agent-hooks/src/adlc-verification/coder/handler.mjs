/**
 * _adlc-coder handler
 *
 * Post-completion pipeline:
 *   1 — oxfmt autofix (must complete before lint)
 *   2 — build, lint, tests, file-disable scan, secret scan, import guard,
 *       implementation-notes check, story coverage, context refresh (parallel)
 *   3 — kill dev server ports (always)
 */

import { build } from "../shared/build.mjs";
import { checkNoCrossBoundaryImports } from "../shared/import-guard.mjs";
import { lint } from "../shared/lint.mjs";
import { noFileDisable } from "../shared/no-file-disable.mjs";
import { oxfmtAutofix } from "../shared/oxfmt-autofix.mjs";
import { tests } from "../shared/tests.mjs";
import { getChangedFiles } from "../utils.mjs";
import { contextRefresh } from "./context-refresh.mjs";
import { implementationNotesCheck } from "./implementation-notes.mjs";
import { killPorts } from "./kill-ports.mjs";
import { noSecrets } from "./no-secrets.mjs";
import { storyCoverage } from "./story-coverage.mjs";

export default async function handleCoder(cwd) {
    const changedFiles = getChangedFiles(cwd);

    // Phase 1: auto-format before lint
    const formatProblems = await oxfmtAutofix(cwd);

    // Phase 2: everything else in parallel
    const results = await Promise.all([
        build(cwd),
        lint(cwd),
        tests(cwd),
        Promise.resolve(noFileDisable(cwd, changedFiles)),
        noSecrets(cwd, changedFiles),
        Promise.resolve(checkNoCrossBoundaryImports(cwd, changedFiles)),
        Promise.resolve(implementationNotesCheck(changedFiles)),
        Promise.resolve(storyCoverage(cwd, changedFiles)),
        Promise.resolve(contextRefresh(cwd))
    ]);

    // Phase 3: kill dev server ports regardless of outcome
    killPorts();

    return [...formatProblems, ...results.flat()];
}
