import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { sliceCriteria } from "../../adlc-verification/planner/slice-criteria.mjs";

describe("slice-criteria", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-sc-"));
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when slice has criteria checkboxes", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-first.md"), ["# Slice 1: First", "", "## Acceptance Criteria", "", "- [ ] Shows a list"].join("\n"));
        expect(sliceCriteria(tmp)).toHaveLength(0);
    });

    it("should fail when slice has no criteria", () => {
        writeFileSync(
            join(tmp, ".adlc/slices/01-empty.md"),
            ["# Slice 1: Empty", "", "## Goal", "", "Do something.", "", "## Scope", "", "- some-module: some work"].join("\n")
        );
        const problems = sliceCriteria(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("no acceptance criteria");
        expect(problems[0]).toContain("01-empty.md");
    });

    it("should only flag slices missing criteria", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-good.md"), "# Slice 1: Good\n\n- [ ] Has a criterion\n");
        writeFileSync(join(tmp, ".adlc/slices/02-bad.md"), "# Slice 2: Bad\n\n## Scope\n\n- module: work\n");
        const problems = sliceCriteria(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("02-bad.md");
        expect(problems[0]).not.toContain("01-good.md");
    });
});
