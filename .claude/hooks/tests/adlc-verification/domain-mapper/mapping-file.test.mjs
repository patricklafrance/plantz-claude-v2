import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mappingFile } from "../../../src/adlc-verification/domain-mapper/mapping-file.mjs";
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

    it("should pass when domain-mapping.md exists and is non-empty", () => {
        writeFileSync(join(tmp, ".adlc/domain-mapping.md"), loadFixture("domain-mapper", "domain-mapping.valid.md"));
        expect(mappingFile(tmp)).toHaveLength(0);
    });

    it("should fail when domain-mapping.md does not exist", () => {
        const problems = mappingFile(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("domain-mapping.md");
    });

    it("should fail when domain-mapping.md is empty", () => {
        writeFileSync(join(tmp, ".adlc/domain-mapping.md"), "");
        const problems = mappingFile(tmp);
        expect(problems).toHaveLength(1);
    });
});
