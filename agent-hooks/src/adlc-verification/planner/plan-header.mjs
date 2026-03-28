/** Verify that .adlc/plan-header.md exists and is non-empty. */

import { hasFile } from "../utils.mjs";

export function planHeader(cwd) {
    if (hasFile(cwd, "plan-header.md")) {
        return [];
    }

    return ["Missing deliverable: `.adlc/plan-header.md` — the planner must write a plan header before stopping."];
}
