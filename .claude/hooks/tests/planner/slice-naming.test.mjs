import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { sliceNaming } from "../../adlc-verification/planner/slice-naming.mjs";

describe("slice-naming", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-sn-"));
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when filenames match NN-title.md convention", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-first.md"), "# Slice 1\n");
        writeFileSync(join(tmp, ".adlc/slices/02-second.md"), "# Slice 2\n");
        expect(sliceNaming(tmp)).toHaveLength(0);
    });

    it("should fail on bad filename (missing number prefix)", () => {
        writeFileSync(join(tmp, ".adlc/slices/plant-list.md"), "# Slice\n");
        const problems = sliceNaming(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("filename convention");
        expect(problems[0]).toContain("plant-list.md");
    });

    it("should only flag bad filenames, not good ones", () => {
        writeFileSync(join(tmp, ".adlc/slices/01-good.md"), "# Good\n");
        writeFileSync(join(tmp, ".adlc/slices/bad-name.md"), "# Bad\n");
        const problems = sliceNaming(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("bad-name.md");
        expect(problems[0]).not.toContain("01-good.md");
    });
});
