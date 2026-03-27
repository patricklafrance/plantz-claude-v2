import { describe, expect, it } from "vitest";

import checkPackageManager from "../../src/tool-guardrails/package-manager.mjs";

describe("package-manager", () => {
    it("should block npm", () => {
        expect(checkPackageManager("Bash", { command: "npm install lodash" })).toEqual({
            action: "block",
            reason: "Blocked: use pnpm instead of npm."
        });
    });

    it("should block npx", () => {
        expect(checkPackageManager("Bash", { command: "npx create-react-app my-app" })?.reason).toContain("pnpm exec");
    });

    it("should block pnpx", () => {
        expect(checkPackageManager("Bash", { command: "pnpx foo" })?.reason).toContain("pnpm exec");
    });

    it("should block pnpm dlx", () => {
        expect(checkPackageManager("Bash", { command: "pnpm dlx foo" })?.reason).toContain("pnpm exec");
    });

    it("should block rtk-wrapped disallowed package manager commands", () => {
        expect(checkPackageManager("Bash", { command: "rtk npx foo" })?.reason).toContain("pnpm exec");
    });

    it("should inspect chained command segments", () => {
        expect(checkPackageManager("Bash", { command: "cd /repo && npm install lodash" })?.reason).toContain("pnpm");
    });

    it("should allow pnpm exec", () => {
        expect(checkPackageManager("Bash", { command: "pnpm exec oxfmt --write ." })).toBeNull();
    });

    it("should ignore non-bash tools", () => {
        expect(checkPackageManager("Read", { file_path: "/tmp/foo" })).toBeNull();
    });
});
