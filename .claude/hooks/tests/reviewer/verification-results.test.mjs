import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resultsFile } from "../../adlc-verification/reviewer/verification-results.mjs";

describe("verification-results", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-rf-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should fail when verification-results.md is missing", () => {
        const problems = resultsFile(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("Missing deliverable");
    });

    it("should pass when verification-results.md exists and is non-empty", () => {
        writeFileSync(join(tmp, ".adlc/verification-results.md"), "# Verification Results\n");
        expect(resultsFile(tmp)).toHaveLength(0);
    });
});
