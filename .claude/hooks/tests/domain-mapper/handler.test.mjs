import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleDomainMapper from "../../src/adlc-verification/domain-mapper/handler.mjs";
import { loadFixture } from "../fixtures/load.mjs";

function gitInit(cwd) {
    execSync("git init && git config user.email test@test.com && git config user.name test && git add -A && git commit --allow-empty -m init", {
        cwd,
        stdio: "ignore"
    });
}

describe("domain-mapper handler (composition)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-dm-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
        gitInit(tmp);
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when mapping file exists and no plan files modified", () => {
        writeFileSync(join(tmp, ".adlc/domain-mapping.md"), loadFixture("domain-mapper", "domain-mapping.valid.md"));
        expect(handleDomainMapper(tmp)).toHaveLength(0);
    });

    it("should fail when domain-mapper modifies plan files", () => {
        writeFileSync(join(tmp, ".adlc/domain-mapping.md"), loadFixture("domain-mapper", "domain-mapping.valid.md"));
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
        writeFileSync(join(tmp, ".adlc/plan-header.md"), "# Plan\n");
        // Re-init git to commit the plan file, then modify it
        execSync('git add -A && git commit -m "add plan"', { cwd: tmp, stdio: "ignore" });
        writeFileSync(join(tmp, ".adlc/plan-header.md"), "# Plan: Modified\n");
        const problems = handleDomainMapper(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("must never modify plan files");
    });

    it("should collect problems from both checks", () => {
        // No mapping file AND modified plan file → 2 problems
        mkdirSync(join(tmp, ".adlc/slices"), { recursive: true });
        writeFileSync(join(tmp, ".adlc/plan-header.md"), "# Plan\n");
        execSync('git add -A && git commit -m "add plan"', { cwd: tmp, stdio: "ignore" });
        writeFileSync(join(tmp, ".adlc/plan-header.md"), "# Plan: Modified\n");
        const problems = handleDomainMapper(tmp);
        expect(problems).toHaveLength(2);
    });
});
