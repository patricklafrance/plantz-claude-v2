import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { criteriaCoverage } from "../../adlc-verification/reviewer/criteria-coverage.mjs";

describe("criteria-coverage", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-cc-"));
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should return [] when results file does not exist", () => {
        expect(criteriaCoverage(tmp)).toHaveLength(0);
    });

    it("should return [] when slice cannot be located (no title match)", () => {
        writeFileSync(join(tmp, ".adlc/verification-results.md"), "# Verification Results\n\n- [x] Some criterion\n");
        expect(criteriaCoverage(tmp)).toHaveLength(0);
    });

    it("should pass when all criteria are covered", () => {
        writeFileSync(
            join(tmp, ".adlc/slices/01-plant-list.md"),
            [
                "# Slice 1: Plant List",
                "",
                "## Acceptance Criteria",
                "",
                "### Visual [visual]",
                "",
                "- [ ] Shows a 3-column grid",
                "- [ ] Each card has a thumbnail",
                "",
                "### Interactive [interactive]",
                "",
                "- [ ] Clicking a card opens detail view"
            ].join("\n")
        );
        writeFileSync(
            join(tmp, ".adlc/verification-results.md"),
            [
                "# Verification Results: Slice 1",
                "",
                "## Passed",
                "",
                "- [x] Shows a 3-column grid",
                "- [x] Each card has a thumbnail",
                "- [x] Clicking a card opens detail view",
                "",
                "## Failed",
                "",
                "## Sanity Issues"
            ].join("\n")
        );
        expect(criteriaCoverage(tmp)).toHaveLength(0);
    });

    it("should fail when criteria are missing from results", () => {
        writeFileSync(
            join(tmp, ".adlc/slices/02-watering.md"),
            [
                "# Slice 2: Watering",
                "",
                "## Acceptance Criteria",
                "",
                "### Visual [visual]",
                "",
                "- [ ] Shows water level indicator",
                "- [ ] Indicator turns red when dry",
                "",
                "### Interactive [interactive]",
                "",
                "- [ ] Clicking water button triggers animation"
            ].join("\n")
        );
        writeFileSync(
            join(tmp, ".adlc/verification-results.md"),
            [
                "# Verification Results: Slice 2",
                "",
                "## Passed",
                "",
                "- [x] Shows water level indicator",
                "",
                "## Failed",
                "",
                "## Sanity Issues"
            ].join("\n")
        );
        const problems = criteriaCoverage(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("2 acceptance criteria");
        expect(problems[0]).toContain("indicator turns red");
        expect(problems[0]).toContain("clicking water button");
    });

    it("should count failed criteria as covered", () => {
        writeFileSync(
            join(tmp, ".adlc/slices/03-details.md"),
            [
                "# Slice 3: Details",
                "",
                "## Acceptance Criteria",
                "",
                "### Visual [visual]",
                "",
                "- [ ] Shows plant name in header",
                "",
                "### Interactive [interactive]",
                "",
                "- [ ] Clicking edit opens form"
            ].join("\n")
        );
        writeFileSync(
            join(tmp, ".adlc/verification-results.md"),
            [
                "# Verification Results: Slice 3",
                "",
                "## Passed",
                "",
                "- [x] Shows plant name in header",
                "",
                "## Failed",
                "",
                "- [ ] Clicking edit opens form — button not found in DOM",
                "",
                "## Sanity Issues"
            ].join("\n")
        );
        expect(criteriaCoverage(tmp)).toHaveLength(0);
    });
});
