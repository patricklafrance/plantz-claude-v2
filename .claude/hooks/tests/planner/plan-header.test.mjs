import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { planHeader } from "../../adlc-verification/planner/plan-header.mjs";
import { loadFixture } from "../fixtures/load.mjs";

describe("plan-header", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-ph-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should fail when plan-header.md is missing", () => {
        const problems = planHeader(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("plan-header.md");
    });

    it("should pass when plan-header.md exists and is non-empty", () => {
        writeFileSync(join(tmp, ".adlc/plan-header.md"), loadFixture("planner", "plan-header.valid.md"));
        expect(planHeader(tmp)).toHaveLength(0);
    });
});
