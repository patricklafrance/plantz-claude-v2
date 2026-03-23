import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { noFileDisable } from "../../adlc-verification/coder/no-file-disable.mjs";

describe("no-file-disable", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-nfd-"));
        mkdirSync(join(tmp, "src"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass on clean file", () => {
        writeFileSync(join(tmp, "src/clean.ts"), "const x = 1;\n");
        expect(noFileDisable(tmp, ["src/clean.ts"])).toHaveLength(0);
    });

    it("should fail on file-level oxlint-disable", () => {
        writeFileSync(join(tmp, "src/bad.ts"), "/* oxlint-disable */\nconst x = 1;\n");
        const result = noFileDisable(tmp, ["src/bad.ts"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("file-disable");
    });

    it("should pass on oxlint-disable-next-line", () => {
        writeFileSync(join(tmp, "src/ok.ts"), "// oxlint-disable-next-line no-explicit-any\nconst x: any = 1;\n");
        expect(noFileDisable(tmp, ["src/ok.ts"])).toHaveLength(0);
    });

    it("should pass on oxlint-disable-line", () => {
        writeFileSync(join(tmp, "src/ok.tsx"), "const x: any = 1; // oxlint-disable-line\n");
        expect(noFileDisable(tmp, ["src/ok.tsx"])).toHaveLength(0);
    });

    it("should skip non-JS/TS files", () => {
        writeFileSync(join(tmp, "src/readme.md"), "/* oxlint-disable */\n");
        expect(noFileDisable(tmp, ["src/readme.md"])).toHaveLength(0);
    });

    it("should skip missing files", () => {
        expect(noFileDisable(tmp, ["src/nope.ts"])).toHaveLength(0);
    });
});
