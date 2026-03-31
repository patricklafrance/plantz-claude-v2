/**
 * _adlc-sprawl-challenger handler
 *
 * Checks:
 *   1. sprawl-challenges.md exists in .adlc/
 */

import { hasFile } from "../utils.mjs";

export default function handleSprawlChallenger(cwd) {
    if (hasFile(cwd, "current-sprawl-challenges.md")) {
        return [];
    }

    return [
        "Missing deliverable: `.adlc/current-sprawl-challenges.md` was not created. " +
            "The sprawl challenger must produce challenge proposals for each create/new-package decision."
    ];
}
