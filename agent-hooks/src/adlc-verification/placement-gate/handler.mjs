/**
 * _adlc-placement-gate handler
 *
 * Checks:
 *   1. no-plan-mutations — must not touch plan files (reads mapping, shouldn't create plans)
 *   2. revision-issues   — if revision exists, it must contain at least one ISSUE block
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { noPlanMutations } from "../plan-gate/no-plan-mutations.mjs";
import { hasFile } from "../utils.mjs";

const ISSUE_RE = /###\s+ISSUE-\d+/;

export default function handlePlacementGate(cwd) {
    const problems = [...noPlanMutations(cwd)];

    if (hasFile(cwd, "placement-gate-revision.md")) {
        const content = readFileSync(resolve(cwd, ".adlc", "placement-gate-revision.md"), "utf8");
        if (!ISSUE_RE.test(content)) {
            problems.push(
                "Revision lacks issues: `.adlc/placement-gate-revision.md` exists but contains no `### ISSUE-N` blocks. " +
                    "If the gate passed, write nothing. If it failed, list specific issues."
            );
        }
    }

    return problems;
}
