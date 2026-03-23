/**
 * The architect must not modify plan files (.adlc/plan-header.md or .adlc/slices/*.md).
 */

import { getChangedFiles } from "../utils.mjs";

const PLAN_FILE_RE = /^\.adlc\/(?:plan-header\.md|slices\/.+\.md)$/;

export function noPlanMutations(cwd) {
    const changed = getChangedFiles(cwd);
    const violations = changed.filter(f => PLAN_FILE_RE.test(f.replace(/\\/g, "/")));

    if (violations.length === 0) {
        return [];
    }

    return [["Contract violation: the architect must never modify plan files.", "", "Modified:", ...violations.map(f => `  - ${f}`)].join("\n")];
}
