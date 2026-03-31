import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleDomainMapper from "../../../src/adlc-verification/domain-mapper/handler.mjs";
import { loadFixture } from "../../fixtures/load.mjs";

describe("domain-mapper handler (composition)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-dm-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when mapping file exists", () => {
        writeFileSync(join(tmp, ".adlc/domain-mapping.md"), loadFixture("domain-mapper", "domain-mapping.valid.md"));
        expect(handleDomainMapper(tmp)).toHaveLength(0);
    });

    it("should fail when mapping file is missing", () => {
        const problems = handleDomainMapper(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("domain-mapping.md");
    });
});
