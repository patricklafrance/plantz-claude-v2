import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleReviewer from "../../adlc-verification/reviewer/handler.mjs";

describe("reviewer handler (orchestration)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-rev-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should short-circuit when results file is missing (skip coverage check)", () => {
        const problems = handleReviewer(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("Missing deliverable");
    });

    it("should run coverage check when results file exists", () => {
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
        writeFileSync(join(tmp, ".adlc/slices/01-test.md"), "# Slice 1: Test\n\n- [ ] Some criterion\n");
        writeFileSync(
            join(tmp, ".adlc/verification-results.md"),
            ["# Verification Results: Slice 1", "", "## Passed", "", "## Failed", "", "## Sanity Issues"].join("\n")
        );
        const problems = handleReviewer(tmp);
        // Missing criterion → coverage check kicks in
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("acceptance criteria");
    });

    it("should pass when all deliverables are valid", () => {
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
        writeFileSync(join(tmp, ".adlc/slices/01-test.md"), "# Slice 1: Test\n\n- [ ] Shows a list\n");
        writeFileSync(
            join(tmp, ".adlc/verification-results.md"),
            ["# Verification Results: Slice 1", "", "## Passed", "", "- [x] Shows a list", "", "## Failed"].join("\n")
        );
        expect(handleReviewer(tmp)).toHaveLength(0);
    });
});
