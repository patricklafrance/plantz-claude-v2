import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = resolve(__dirname, "../../src/pre-commit/pre-tool-use-bash.mjs");
const REPO_ROOT = resolve(__dirname, "../../../..");

function pipeToHook(input, timeout = 10_000) {
    try {
        const stdout = execFileSync(process.execPath, [HOOK_PATH], {
            input: JSON.stringify(input),
            encoding: "utf8",
            cwd: REPO_ROOT,
            timeout
        });
        return { exitCode: 0, stdout };
    } catch (error) {
        return {
            exitCode: error.status ?? 1,
            stdout: error.stdout?.toString() ?? "",
            stderr: error.stderr?.toString() ?? ""
        };
    }
}

describe("pre-commit entry point", () => {
    it("should exit 0 for non-commit Bash commands", () => {
        const result = pipeToHook({ tool_input: { command: "git status" } });
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe("");
    });

    it("should exit 0 when tool_input has no command", () => {
        const result = pipeToHook({ tool_input: {} });
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe("");
    });

    it("should exit 0 for git commands that contain commit as substring", () => {
        // "git commit-tree" should not trigger pre-commit
        const result = pipeToHook({ tool_input: { command: "git commit-tree abc" } });
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe("");
    });

    it("should run pipeline for git commit and return valid output", () => {
        const result = pipeToHook({ tool_input: { command: "git commit -m 'test'" } }, 5 * 60_000);

        if (result.exitCode === 0 && result.stdout.trim() === "") {
            // All checks passed — clean repo
            expect(true).toBe(true);
        } else {
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed.decision).toBe("block");
            expect(typeof parsed.reason).toBe("string");
        }
    });
});
