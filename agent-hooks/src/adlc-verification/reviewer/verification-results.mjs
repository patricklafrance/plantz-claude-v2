/** Verify that .adlc/verification-results.md exists and is non-empty. */

import { hasFile } from "../utils.mjs";

export function resultsFile(cwd) {
    if (hasFile(cwd, "verification-results.md")) {
        return [];
    }

    return ["Missing deliverable: `.adlc/verification-results.md` — the reviewer must write verification results before stopping."];
}
