import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { sliceReferencePackages } from "../../src/adlc-verification/planner/slice-reference-packages.mjs";
import { loadFixture } from "../fixtures/load.mjs";

describe("slice-reference-packages", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-srp-"));
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when slice has a Reference Packages section", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-plant-list.md"), loadFixture("planner", "slice-01-plant-list.valid.md"));
        expect(sliceReferencePackages(tmp)).toHaveLength(0);
    });

    it("should fail when slice has no Reference Packages section", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-missing.md"), loadFixture("planner", "slice-no-reference-packages.invalid.md"));
        const problems = sliceReferencePackages(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("Reference Packages");
        expect(problems[0]).toContain("01-missing.md");
    });

    it("should only flag slices missing the section", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-good.md"), loadFixture("planner", "slice-01-plant-list.valid.md"));
        writeFileSync(join(tmp, ".adlc/slices/02-bad.md"), loadFixture("planner", "slice-no-reference-packages.invalid.md"));
        const problems = sliceReferencePackages(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("02-bad.md");
        expect(problems[0]).not.toContain("01-good.md");
    });
});
