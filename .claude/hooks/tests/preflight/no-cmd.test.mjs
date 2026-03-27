import { describe, expect, it } from "vitest";

import checkNoCmd from "../../src/preflight/no-cmd.mjs";

describe("no-cmd", () => {
    it("should block cmd /c", () => {
        expect(checkNoCmd("Bash", { command: "cmd /c dir" })).toEqual({
            action: "block",
            reason: "Blocked: use bash directly, not Windows cmd."
        });
    });

    it("should block cmd //c", () => {
        expect(checkNoCmd("Bash", { command: "cmd //c pnpm lint" })?.reason).toContain("Windows cmd");
    });

    it("should block cmd.exe", () => {
        expect(checkNoCmd("Bash", { command: "cmd.exe /c pnpm lint" })?.reason).toContain("Windows cmd");
    });

    it("should block cmd in chained segments", () => {
        expect(checkNoCmd("Bash", { command: "cd /repo && cmd /c pnpm lint" })?.reason).toContain("Windows cmd");
    });

    it("should block rtk-wrapped cmd", () => {
        expect(checkNoCmd("Bash", { command: "rtk cmd /c pnpm lint" })?.reason).toContain("Windows cmd");
    });

    it("should allow normal bash commands", () => {
        expect(checkNoCmd("Bash", { command: "pnpm lint" })).toBeNull();
    });
});
