/**
 * _adlc-cohesion-challenger handler
 *
 * Checks:
 *   1. cohesion-challenges.md exists in .adlc/
 */

import { hasFile } from "../utils.mjs";

export default function handleCohesionChallenger(cwd) {
    if (hasFile(cwd, "current-cohesion-challenges.md")) {
        return [];
    }

    return [
        "Missing deliverable: `.adlc/current-cohesion-challenges.md` was not created. " +
            "The cohesion challenger must produce assessments for each `extend+new-entity` decision."
    ];
}
