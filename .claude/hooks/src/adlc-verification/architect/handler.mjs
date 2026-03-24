/**
 * _adlc-architect handler
 *
 * Checks:
 *   1. no-plan-mutations  — architect must not modify plan files
 *   2. revision-slice-refs — if revision exists, it should reference at least one slice
 */

import { noPlanMutations } from "./no-plan-mutations.mjs";
import { revisionSliceRefs } from "./revision-slice-refs.mjs";

export default function handleArchitect(cwd) {
    return [...noPlanMutations(cwd), ...revisionSliceRefs(cwd)];
}
