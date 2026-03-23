import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleArchitect from "../../adlc-verification/architect/handler.mjs";

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

    it("should pass when revision is well-formed", () => {
        writeFileSync(
            join(tmp, ".adlc/architect-revision.md"),
            [
                "# Architect Revision",
                "",
                "## Problem",
                "",
                "Route conflict.",
                "",
                "## Evidence",
                "",
                "- Slice 01 and Slice 02 collide",
                "",
                "## Required Changes",
                "",
                "Deduplicate."
            ].join("\n")
        );
        expect(handleArchitect(tmp)).toHaveLength(0);
    });

    it("should collect problems from multiple checks", () => {
        // Missing sections + no slice refs → two problems
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), "# Architect Revision\n\nSomething is wrong.\n");
        const problems = handleArchitect(tmp);
        expect(problems.length).toBeGreaterThanOrEqual(2);
    });
});
