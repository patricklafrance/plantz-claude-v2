/**
 * _adlc-module-mapper handler
 *
 * Checks:
 *   1. mapping-file     — .adlc/module-mapping.md exists
 *   2. engagement-check  — after challenge-revision, verifies mapper engaged with challenges
 */

import { engagementCheck } from "./engagement-check.mjs";
import { mappingFile } from "./mapping-file.mjs";

export default function handleModuleMapper(cwd) {
    return [...mappingFile(cwd), ...engagementCheck(cwd)];
}
