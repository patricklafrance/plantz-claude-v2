import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mappingFile } from "../../../src/adlc-verification/module-mapper/mapping-file.mjs";
import { loadFixture } from "../../fixtures/load.mjs";

describe("mapping-file", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-dm-mf-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when module-mapping.md exists and is non-empty", () => {
        writeFileSync(join(tmp, ".adlc/module-mapping.md"), loadFixture("module-mapper", "module-mapping.valid.md"));
        expect(mappingFile(tmp)).toHaveLength(0);
    });

    it("should fail when module-mapping.md does not exist", () => {
        const problems = mappingFile(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("module-mapping.md");
    });

    it("should fail when module-mapping.md is empty", () => {
        writeFileSync(join(tmp, ".adlc/module-mapping.md"), "");
        const problems = mappingFile(tmp);
        expect(problems).toHaveLength(1);
    });
});
