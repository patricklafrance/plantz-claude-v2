/**
 * _adlc-planner handler
 *
 * Post-completion pipeline:
 *   1 — plan-header.md exists
 *   2 — at least one slice file in .adlc/slices/
 *   3 — slice filenames match NN-*.md convention
 *   4 — every slice has at least one acceptance criterion
 */

import { planHeader } from "./plan-header.mjs";
import { sliceCriteria } from "./slice-criteria.mjs";
import { sliceFiles } from "./slice-files.mjs";
import { sliceNaming } from "./slice-naming.mjs";

export default function handlePlanner(cwd) {
    const problems = [...planHeader(cwd), ...sliceFiles(cwd)];

    // No slices → remaining checks are meaningless
    if (problems.some(p => p.includes("no slice files"))) {
        return problems;
    }

    problems.push(...sliceNaming(cwd), ...sliceCriteria(cwd));

    return problems;
}
