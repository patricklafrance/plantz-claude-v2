import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import handleModuleMapper from "../../../src/adlc-verification/module-mapper/handler.mjs";
import { loadFixture } from "../../fixtures/load.mjs";

describe("module-mapper handler (composition)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-dm-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when mapping file exists", () => {
        writeFileSync(join(tmp, ".adlc/module-mapping.md"), loadFixture("module-mapper", "module-mapping.valid.md"));
        expect(handleModuleMapper(tmp)).toHaveLength(0);
    });

    it("should fail when mapping file is missing", () => {
        const problems = handleModuleMapper(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("module-mapping.md");
    });
});
