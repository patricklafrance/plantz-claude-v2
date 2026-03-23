import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleArchitect from "../../adlc-verification/architect/handler.mjs";
import { loadFixture } from "../fixtures/load.mjs";

describe("architect handler (composition)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-arch-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
        execSync("git init && git config user.email test@test.com && git config user.name test && git add -A && git commit --allow-empty -m init", {
            cwd: tmp,
            stdio: "ignore"
        });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when no revision file exists (architect approved)", () => {
        expect(handleArchitect(tmp)).toHaveLength(0);
    });

    it("should pass when revision references a slice", () => {
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), loadFixture("architect", "revision.valid.md"));
        expect(handleArchitect(tmp)).toHaveLength(0);
    });

    it("should fail when revision lacks slice references", () => {
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), loadFixture("architect", "revision-no-refs.invalid.md"));
        const problems = handleArchitect(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("slice references");
    });
});
