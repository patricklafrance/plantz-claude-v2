import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = resolve(__dirname, "../src/enforce-pnpm.sh");

function pipeToHook(command) {
    try {
        const stdout = execFileSync("bash", [HOOK_PATH], {
            input: JSON.stringify({ tool_input: { command } }),
            encoding: "utf8",
            timeout: 5000
        });
        return { exitCode: 0, stdout, stderr: "" };
    } catch (error) {
        return {
            exitCode: error.status ?? 1,
            stdout: error.stdout?.toString() ?? "",
            stderr: error.stderr?.toString() ?? ""
        };
    }
}

describe("enforce-pnpm", () => {
    it("should block npm commands", () => {
        const result = pipeToHook("npm install lodash");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm");
    });

    it("should block bare npm", () => {
        const result = pipeToHook("npm");
        expect(result.exitCode).toBe(2);
    });

    it("should block npx commands", () => {
        const result = pipeToHook("npx create-react-app my-app");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should block pnpx commands", () => {
        const result = pipeToHook("pnpx create-react-app my-app");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should block bare pnpx", () => {
        const result = pipeToHook("pnpx");
        expect(result.exitCode).toBe(2);
    });

    it("should block pnpm dlx commands", () => {
        const result = pipeToHook("pnpm dlx create-react-app my-app");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should allow pnpm commands", () => {
        const result = pipeToHook("pnpm install lodash");
        expect(result.exitCode).toBe(0);
    });

    it("should allow pnpm exec commands", () => {
        const result = pipeToHook("pnpm exec oxfmt --write .");
        expect(result.exitCode).toBe(0);
    });

    it("should allow unrelated commands", () => {
        const result = pipeToHook("git status");
        expect(result.exitCode).toBe(0);
    });

    it("should not block commands containing npm as substring", () => {
        const result = pipeToHook("echo npm is great");
        expect(result.exitCode).toBe(0);
    });
});
