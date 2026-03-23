/**
 * _adlc-reviewer handler
 *
 * Post-completion pipeline:
 *   1 — verification-results.md exists
 *   2 — every acceptance criterion from the slice appears in Passed or Failed
 */

import { criteriaCoverage } from "./criteria-coverage.mjs";
import { resultsFile } from "./verification-results.mjs";

export default function handleReviewer(cwd) {
    const problems = resultsFile(cwd);

    // No results file → coverage check is meaningless
    if (problems.length > 0) {
        return problems;
    }

    problems.push(...criteriaCoverage(cwd));

    return problems;
}
