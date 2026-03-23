import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleDomainMapper from "../../adlc-verification/domain-mapper/handler.mjs";
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

    it("should fail when no mapping file exists", () => {
        const problems = handleDomainMapper(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("domain-mapping.md");
    });

    it("should pass when mapping file exists", () => {
        writeFileSync(join(tmp, ".adlc/domain-mapping.md"), loadFixture("domain-mapper", "domain-mapping.valid.md"));
        expect(handleDomainMapper(tmp)).toHaveLength(0);
    });
});
