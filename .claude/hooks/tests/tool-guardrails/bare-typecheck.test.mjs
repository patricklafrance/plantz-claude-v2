import { describe, expect, it } from "vitest";

import checkBareTypecheck from "../../src/tool-guardrails/bare-typecheck.mjs";

describe("bare-typecheck", () => {
    it("should block bare pnpm typecheck", () => {
        expect(checkBareTypecheck("Bash", { command: "pnpm typecheck" })).toEqual({
            action: "block",
            reason: "Blocked: use pnpm lint for full validation or pnpm --filter @package typecheck for scoped checks."
        });
    });

    it("should block chained bare pnpm typecheck", () => {
        expect(checkBareTypecheck("Bash", { command: "cd /repo && pnpm typecheck" })?.reason).toContain("pnpm lint");
    });

    it("should allow filtered typecheck", () => {
        expect(checkBareTypecheck("Bash", { command: "pnpm --filter @packages/components typecheck" })).toBeNull();
    });

    it("should allow pnpm lint", () => {
        expect(checkBareTypecheck("Bash", { command: "pnpm lint" })).toBeNull();
    });

    it("should allow unrelated commands", () => {
        expect(checkBareTypecheck("Bash", { command: "git status" })).toBeNull();
    });
});
