import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { bashPath } from "./resolve-bash.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = resolve(__dirname, "../src/enforce-pnpm.sh");

function pipeToHook(command) {
    try {
        const stdout = execFileSync(bashPath, [HOOK_PATH], {
            input: JSON.stringify({ tool_input: { command } }),
            encoding: "utf8",
            timeout: 15_000
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

describe.skipIf(!bashPath)("enforce-pnpm", () => {
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

    // ── Chained commands ─────────────────────────────────

    it("should block npx after cd &&", () => {
        const result = pipeToHook("cd C:/Dev/project && npx agent-browser screenshot");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should block npm after cd &&", () => {
        const result = pipeToHook("cd C:/Dev/project && npm install lodash");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm");
    });

    it("should block npx after semicolon", () => {
        const result = pipeToHook("echo hello; npx something");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should block npm after ||", () => {
        const result = pipeToHook("pnpm install || npm install");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm");
    });

    it("should block npx chained with multiple &&", () => {
        const result = pipeToHook("cd /foo && sleep 1 && npx agent-browser open http://localhost:8080");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should allow chained pnpm commands", () => {
        const result = pipeToHook("cd C:/Dev/project && pnpm exec agent-browser screenshot");
        expect(result.exitCode).toBe(0);
    });

    // ── RTK-wrapped commands ──────────────────────────────

    it("should block rtk-wrapped npm commands", () => {
        const result = pipeToHook("rtk npm install lodash");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm");
    });

    it("should block rtk-wrapped npx commands", () => {
        const result = pipeToHook("rtk npx create-react-app my-app");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should block rtk-wrapped pnpx commands", () => {
        const result = pipeToHook("rtk pnpx something");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should block rtk-wrapped pnpm dlx commands", () => {
        const result = pipeToHook("rtk pnpm dlx create-react-app my-app");
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("pnpm exec");
    });

    it("should allow rtk-wrapped pnpm commands", () => {
        const result = pipeToHook("rtk pnpm install lodash");
        expect(result.exitCode).toBe(0);
    });
});
