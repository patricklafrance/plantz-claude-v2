/**
 * _adlc-domain-mapper handler
 *
 * Checks:
 *   1. mapping-file     — .adlc/domain-mapping.md exists
 *   2. no-plan-mutations — must not touch plan files (reused from architect)
 */

import { noPlanMutations } from "../architect/no-plan-mutations.mjs";
import { mappingFile } from "./mapping-file.mjs";

export default function handleDomainMapper(cwd) {
    return [...mappingFile(cwd), ...noPlanMutations(cwd)];
}
