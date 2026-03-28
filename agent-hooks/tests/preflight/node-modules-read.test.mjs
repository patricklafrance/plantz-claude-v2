import { describe, expect, it } from "vitest";

import checkNodeModulesRead from "../../src/preflight/node-modules-read.mjs";

describe("node-modules-read", () => {
    it("should block Read calls into node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "node_modules/@base-ui/react/foo.js" })).toEqual({
            action: "block",
            reason: "Blocked: don't read library source in node_modules (type definitions — .d.ts, .d.mts, .d.cts — are allowed)."
        });
    });

    it("should block Read calls into nested node_modules paths", () => {
        expect(checkNodeModulesRead("Read", { file_path: "C:\\repo\\node_modules\\pkg\\index.js" })?.reason).toContain("library source");
    });

    it("should allow Read calls to .d.ts files in node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "node_modules/@tanstack/db/dist/esm/transactions.d.ts" })).toBeNull();
    });

    it("should allow Read calls to .d.mts files in node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "node_modules/@tanstack/db/dist/esm/index.d.mts" })).toBeNull();
    });

    it("should allow Read calls to .d.cts files in node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "node_modules/@tanstack/db/dist/cjs/index.d.cts" })).toBeNull();
    });

    it("should allow Read calls to .d.ts files in nested node_modules", () => {
        expect(
            checkNodeModulesRead("Read", {
                file_path: "C:\\repo\\node_modules\\.pnpm\\@tanstack+db@0.5.33\\node_modules\\@tanstack\\db\\dist\\esm\\optimistic-action.d.ts"
            })
        ).toBeNull();
    });

    it("should block Read calls to .d.ts.map files in node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "node_modules/@tanstack/db/dist/esm/index.d.ts.map" })?.reason).toContain("library source");
    });

    it("should allow Read calls outside node_modules", () => {
        expect(checkNodeModulesRead("Read", { file_path: "packages/components/src/index.ts" })).toBeNull();
    });

    it("should block Glob patterns targeting node_modules", () => {
        expect(checkNodeModulesRead("Glob", { pattern: "**/node_modules/**/*.js" })?.reason).toContain("library source");
    });

    it("should block Glob when path targets node_modules", () => {
        expect(checkNodeModulesRead("Glob", { pattern: "**/*.ts", path: "node_modules/.pnpm/@tanstack" })?.reason).toContain("library source");
    });

    it("should allow Glob patterns targeting .d.ts in node_modules", () => {
        expect(checkNodeModulesRead("Glob", { pattern: "**/node_modules/.pnpm/@tanstack+db*/node_modules/@tanstack/db/**/*.d.ts" })).toBeNull();
    });

    it("should allow Glob patterns targeting .d.mts in node_modules", () => {
        expect(checkNodeModulesRead("Glob", { pattern: "**/node_modules/@tanstack/db/**/*.d.mts" })).toBeNull();
    });

    it("should allow Glob patterns that do not target node_modules", () => {
        expect(checkNodeModulesRead("Glob", { pattern: "packages/**/*.ts" })).toBeNull();
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

    it("should block bash inspection of node_modules when path contains s before node_modules", () => {
        expect(checkNodeModulesRead("Bash", { command: "cat /some/node_modules/pkg/index.js" })?.reason).toContain("library source");
    });

    it("should allow bash commands that do not inspect node_modules", () => {
        expect(checkNodeModulesRead("Bash", { command: "rg PlantList packages/core-plants/src" })).toBeNull();
    });
});
