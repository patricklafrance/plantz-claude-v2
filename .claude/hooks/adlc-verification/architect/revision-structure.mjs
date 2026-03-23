/**
 * If architect-revision.md exists, validate that it has the three
 * required sections: Problem, Evidence, Required Changes.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { hasFile } from "../utils.mjs";

const REQUIRED_SECTIONS = ["## Problem", "## Evidence", "## Required Changes"];

export function revisionStructure(cwd) {
    if (!hasFile(cwd, "architect-revision.md")) {
        return [];
    }

    const content = readFileSync(resolve(cwd, ".adlc", "architect-revision.md"), "utf8");
    const missing = REQUIRED_SECTIONS.filter(heading => !content.includes(heading));

    if (missing.length === 0) {
        return [];
    }

    return [
        ["Incomplete revision: `.adlc/architect-revision.md` is missing required sections.", "", "Missing:", ...missing.map(h => `  - ${h}`)].join(
            "\n"
        )
    ];
}
