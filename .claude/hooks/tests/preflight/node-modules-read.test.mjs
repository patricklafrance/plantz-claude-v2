import { describe, expect, it } from "vitest";

import checkNodeModulesRead from "../../src/preflight/node-modules-read.mjs";

describe("node-modules-read", () => {
    it("should block Read calls into node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "node_modules/@base-ui/react/foo.js" })).toEqual({
            action: "block",
            reason: "Blocked: don't read library source in node_modules. Check TypeScript types or API docs instead."
        });
    });

    it("should block Read calls into nested node_modules paths", () => {
        expect(checkNodeModulesRead("Read", { file_path: "C:\\repo\\node_modules\\pkg\\index.js" })?.reason).toContain("TypeScript types");
    });

    it("should allow Read calls outside node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "packages/components/src/index.ts" })).toBeNull();
    });

    it("should block bash search commands into node_modules", () => {
        expect(checkNodeModulesRead("Bash", { command: "rg BaseUI node_modules/@base-ui" })?.reason).toContain("library source");
    });

    it("should block bash file reads into node_modules", () => {
        expect(checkNodeModulesRead("Bash", { command: "cat node_modules/foo/index.js" })?.reason).toContain("library source");
    });

    it("should block chained bash inspection commands into node_modules", () => {
        expect(checkNodeModulesRead("Bash", { command: "cd /repo && find node_modules -name '*.d.ts'" })?.reason).toContain("library source");
    });

    it("should allow bash commands that do not inspect node_modules", () => {
        expect(checkNodeModulesRead("Bash", { command: "rg PlantList packages/core-plants/src" })).toBeNull();
    });
});
