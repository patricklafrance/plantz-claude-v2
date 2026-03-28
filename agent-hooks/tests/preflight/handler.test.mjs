import { describe, expect, it } from "vitest";

import { evaluate } from "../../src/preflight/handler.mjs";

describe("preflight handler", () => {
    it("should allow safe bash commands", () => {
        expect(evaluate("Bash", { command: "pnpm exec oxfmt --write ." })).toEqual({ action: "allow" });
    });

    it("should allow safe read calls", () => {
        expect(evaluate("Read", { file_path: "packages/components/src/index.ts" })).toEqual({ action: "allow" });
    });

    it("should route package manager blocks", () => {
        expect(evaluate("Bash", { command: "npm install lodash" })?.reason).toContain("pnpm");
    });

    it("should route cmd blocks", () => {
        expect(evaluate("Bash", { command: "cmd /c dir" })?.reason).toContain("Windows cmd");
    });

    it("should route bare typecheck blocks", () => {
        expect(evaluate("Bash", { command: "pnpm typecheck" })?.reason).toContain("pnpm lint");
    });

    it("should route node_modules read blocks for Read", () => {
        expect(evaluate("Read", { file_path: "node_modules/pkg/index.js" })?.reason).toContain("library source");
    });
});
