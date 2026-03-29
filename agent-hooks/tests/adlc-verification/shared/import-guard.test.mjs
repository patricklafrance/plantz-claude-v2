import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { checkNoCrossBoundaryImports } from "../../../src/adlc-verification/shared/import-guard.mjs";

describe("import-guard", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-ig-"));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    function writeFile(relPath, content) {
        const abs = join(tmp, relPath);
        mkdirSync(join(abs, ".."), { recursive: true });
        writeFileSync(abs, content);
    }

    it("should allow module importing @packages/*", () => {
        writeFile("apps/plants/plant-list/src/hook.ts", 'import { api } from "@packages/api";\n');
        expect(checkNoCrossBoundaryImports(tmp, ["apps/plants/plant-list/src/hook.ts"])).toHaveLength(0);
    });

    it("should block module importing another module", () => {
        writeFile("apps/plants/plant-list/src/bad.ts", 'import { something } from "@modules/auth-login";\n');
        const result = checkNoCrossBoundaryImports(tmp, ["apps/plants/plant-list/src/bad.ts"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("Cross-boundary");
    });

    it("should block package importing @modules/*", () => {
        writeFile("packages/ui/src/index.ts", 'import { x } from "@modules/auth-login";\n');
        expect(checkNoCrossBoundaryImports(tmp, ["packages/ui/src/index.ts"])).toHaveLength(1);
    });

    it("should allow package importing @packages/*", () => {
        writeFile("packages/ui/src/index.ts", 'import { x } from "@packages/utils";\n');
        expect(checkNoCrossBoundaryImports(tmp, ["packages/ui/src/index.ts"])).toHaveLength(0);
    });

    it("should allow host importing @modules/*", () => {
        writeFile("apps/host/src/index.ts", 'import { x } from "@modules/auth-login";\n');
        expect(checkNoCrossBoundaryImports(tmp, ["apps/host/src/index.ts"])).toHaveLength(0);
    });

    it("should block host importing @apps/*", () => {
        writeFile("apps/host/src/index.ts", 'import { x } from "@apps/something";\n');
        expect(checkNoCrossBoundaryImports(tmp, ["apps/host/src/index.ts"])).toHaveLength(1);
    });

    it("should skip non-TS files", () => {
        writeFile("apps/plants/plant-list/src/style.css", '@import "@modules/auth-login";\n');
        expect(checkNoCrossBoundaryImports(tmp, ["apps/plants/plant-list/src/style.css"])).toHaveLength(0);
    });
});
