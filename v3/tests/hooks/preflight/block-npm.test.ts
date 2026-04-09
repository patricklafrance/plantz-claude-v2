import { describe, expect, it } from "vitest";

import checkBlockNpm from "../../../src/hooks/preflight/block-npm.js";

describe("block-npm", () => {
    it("should block npm", () => {
        expect(checkBlockNpm("Bash", { command: "npm install lodash" })).toEqual({
            action: "block",
            reason: "Blocked: use pnpm instead of npm."
        });
    });

    it("should block npx", () => {
        expect(checkBlockNpm("Bash", { command: "npx create-react-app my-app" })?.reason).toContain("pnpm exec");
    });

    it("should block pnpx", () => {
        expect(checkBlockNpm("Bash", { command: "pnpx foo" })?.reason).toContain("pnpm exec");
    });

    it("should block pnpm dlx", () => {
        expect(checkBlockNpm("Bash", { command: "pnpm dlx foo" })?.reason).toContain("pnpm exec");
    });

    it("should inspect chained command segments", () => {
        expect(checkBlockNpm("Bash", { command: "cd /repo && npm install lodash" })?.reason).toContain("pnpm");
    });

    it("should allow pnpm exec", () => {
        expect(checkBlockNpm("Bash", { command: "pnpm exec oxfmt --write ." })).toBeNull();
    });

    it("should ignore non-bash tools", () => {
        expect(checkBlockNpm("Read", { file_path: "/tmp/foo" })).toBeNull();
    });
});
