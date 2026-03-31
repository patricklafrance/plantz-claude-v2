/**
 * _adlc-plan-gate handler
 *
 * Checks:
 *   1. no-plan-mutations  — plan-gate must not modify plan files
 *   2. revision-slice-refs — if revision exists, it should reference at least one slice
 */

import { noPlanMutations } from "./no-plan-mutations.mjs";
import { revisionSliceRefs } from "./revision-slice-refs.mjs";

export default function handlePlanGate(cwd) {
    return [...noPlanMutations(cwd), ...revisionSliceRefs(cwd)];
}
