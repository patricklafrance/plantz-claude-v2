/** Verify that all slice filenames match the NN-{title}.md convention. */

import { listFiles } from "../utils.mjs";

const SLICE_FILENAME_RE = /^\d{2}-.+\.md$/;

export function sliceNaming(cwd) {
    const files = listFiles(cwd, "slices", ".md");
    const badNames = files.filter(f => !SLICE_FILENAME_RE.test(f));

    if (badNames.length === 0) {
        return [];
    }

    return [
        [
            "Slice filename convention violated: filenames must match `NN-{title}.md` (2-digit prefix).",
            "",
            "Invalid:",
            ...badNames.map(f => `  - ${f}`)
        ].join("\n")
    ];
}
