import { describe, expect, it } from "vitest";

import checkBlockBareTypecheck from "../../../src/hooks/preflight/block-bare-typecheck.js";

describe("block-bare-typecheck", () => {
    it("should block bare pnpm typecheck", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "pnpm typecheck" })?.reason).toContain("pnpm lint");
    });

    it("should block chained bare pnpm typecheck", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "cd /repo && pnpm typecheck" })?.reason).toContain("pnpm lint");
    });

    it("should allow filtered typecheck", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "pnpm --filter @packages/components typecheck" })).toBeNull();
    });

    it("should allow pnpm lint", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "pnpm lint" })).toBeNull();
    });

    it("should block bare pnpm run typecheck", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "pnpm run typecheck" })?.reason).toContain("pnpm lint");
    });

    it("should block chained pnpm run typecheck", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "cd /repo && pnpm run typecheck" })?.reason).toContain("pnpm lint");
    });

    it("should allow unrelated commands", () => {
        expect(checkBlockBareTypecheck("Bash", { command: "git status" })).toBeNull();
    });
});
