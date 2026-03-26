/**
 * _adlc-planner handler
 *
 * Checks:
 *   1. plan-header          — plan-header.md exists
 *   2. slice-files          — at least one slice file in .adlc/slices/
 *   3. slice-criteria       — every slice has at least one acceptance criterion
 *   4. slice-ref-packages   — every slice has a Reference Packages section
 */

import { planHeader } from "./plan-header.mjs";
import { sliceCriteria } from "./slice-criteria.mjs";
import { sliceFiles } from "./slice-files.mjs";
import { sliceReferencePackages } from "./slice-reference-packages.mjs";

export default function handlePlanner(cwd) {
    const problems = [...planHeader(cwd), ...sliceFiles(cwd)];

    // No slices → per-slice checks are meaningless
    if (problems.some(p => p.includes("no slice files"))) {
        return problems;
    }

    problems.push(...sliceCriteria(cwd), ...sliceReferencePackages(cwd));

    return problems;
}
