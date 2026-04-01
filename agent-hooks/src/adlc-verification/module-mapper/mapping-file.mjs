/**
 * The module-mapper must produce .adlc/module-mapping.md.
 */

import { hasFile } from "../utils.mjs";

export function mappingFile(cwd) {
    if (hasFile(cwd, "module-mapping.md")) {
        return [];
    }

    return [
        "Missing deliverable: `.adlc/module-mapping.md` was not created. The module-mapper must produce a mapping file before planning can begin."
    ];
}
