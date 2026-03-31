/**
 * _adlc-evidence-researcher handler
 *
 * Checks:
 *   1. evidence-findings.md exists in .adlc/
 */

import { hasFile } from "../utils.mjs";

export default function handleEvidenceResearcher(cwd) {
    if (hasFile(cwd, "evidence-findings.md")) {
        return [];
    }

    return [
        "Missing deliverable: `.adlc/evidence-findings.md` was not created. " + "The evidence researcher must produce findings for each evidence gap."
    ];
}
