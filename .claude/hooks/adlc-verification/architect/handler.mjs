/**
 * _adlc-architect handler
 *
 * Post-completion pipeline:
 *   1 — if revision exists, validate structure (Problem, Evidence, Required Changes)
 *   2 — architect must not modify plan files
 *   3 — if revision exists, it should reference at least one slice
 */

import { noPlanMutations } from "./no-plan-mutations.mjs";
import { revisionSliceRefs } from "./revision-slice-refs.mjs";
import { revisionStructure } from "./revision-structure.mjs";

export default function handleArchitect(cwd) {
    return [...revisionStructure(cwd), ...noPlanMutations(cwd), ...revisionSliceRefs(cwd)];
}
