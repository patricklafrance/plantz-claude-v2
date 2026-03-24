import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handlePlanner from "../../adlc-verification/planner/handler.mjs";
import { loadFixture } from "../fixtures/load.mjs";

describe("planner handler (orchestration)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-plan-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should collect problems from multiple checks", () => {
        // No header, no slices → at least 2 problems
        const problems = handlePlanner(tmp);
        expect(problems.length).toBeGreaterThanOrEqual(2);
    });

    it("should short-circuit when no slices exist (skip criteria check)", () => {
        writeFileSync(join(tmp, ".adlc/plan-header.md"), loadFixture("planner", "plan-header.valid.md"));
        // Header exists but no slices → only the slice-files problem, no criteria errors
        const problems = handlePlanner(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("no slice files");
    });

    it("should report criteria problems when slices exist but lack criteria", () => {
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
        writeFileSync(join(tmp, ".adlc/plan-header.md"), loadFixture("planner", "plan-header.valid.md"));
        writeFileSync(join(tmp, ".adlc/slices/01-empty.md"), loadFixture("planner", "slice-no-criteria.invalid.md"));
        const problems = handlePlanner(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("no acceptance criteria");
    });

    it("should pass when all deliverables are valid", () => {
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
        writeFileSync(join(tmp, ".adlc/plan-header.md"), loadFixture("planner", "plan-header.valid.md"));
        writeFileSync(join(tmp, ".adlc/slices/01-plant-list.md"), loadFixture("planner", "slice-01-plant-list.valid.md"));
        expect(handlePlanner(tmp)).toHaveLength(0);
    });
});
