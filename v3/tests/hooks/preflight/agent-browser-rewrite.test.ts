import { describe, expect, it } from "vitest";

import { rewriteBareAgent } from "../../../src/hooks/preflight/agent-browser-rewrite.js";

describe("agent-browser rewrite", () => {
    it("rewrites bare agent-browser invocations", () => {
        expect(rewriteBareAgent("agent-browser snapshot -i -c")).toBe("pnpm exec agent-browser snapshot -i -c");
        expect(rewriteBareAgent("cd /repo && agent-browser screenshot")).toBe("cd /repo && pnpm exec agent-browser screenshot");
    });

    it("rewrites multiple bare invocations in a chain", () => {
        expect(rewriteBareAgent("agent-browser click @e7 && agent-browser screenshot")).toBe(
            "pnpm exec agent-browser click @e7 && pnpm exec agent-browser screenshot"
        );
    });

    it("does not rewrite already-prefixed or unrelated commands", () => {
        expect(rewriteBareAgent("pnpm exec agent-browser snapshot")).toBeNull();
        expect(rewriteBareAgent("git status")).toBeNull();
    });
});
