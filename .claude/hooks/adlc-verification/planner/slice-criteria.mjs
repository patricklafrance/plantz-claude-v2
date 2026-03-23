/** Verify that every slice has at least one acceptance criterion. */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { listFiles } from "../utils.mjs";

/** True when the content contains at least one `- [ ] ...` checkbox. */
function hasCriteria(content) {
    return /^[-*]\s*\[[ ]\]\s+.+$/m.test(content);
}

export function sliceCriteria(cwd) {
    const sliceFiles = listFiles(cwd, "slices", ".md");
    const slicesDir = resolve(cwd, ".adlc", "slices");
    const emptyCriteria = [];

    for (const file of sliceFiles) {
        try {
            const content = readFileSync(resolve(slicesDir, file), "utf8");
            if (!hasCriteria(content)) {
                emptyCriteria.push(file);
            }
        } catch {
            // Can't read — skip
        }
    }

    if (emptyCriteria.length === 0) {
        return [];
    }

    return [
        [
            "Slices with no acceptance criteria: the reviewer cannot verify a slice without `- [ ]` checkboxes.",
            "",
            "Missing criteria:",
            ...emptyCriteria.map(f => `  - ${f}`)
        ].join("\n")
    ];
}
