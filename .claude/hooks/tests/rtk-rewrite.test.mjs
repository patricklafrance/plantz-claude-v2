import { execFileSync } from "node:child_process";
import { delimiter, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { bashPath } from "./resolve-bash.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = resolve(__dirname, "../src/rtk-rewrite.sh");

let hasRtk;
try {
    execFileSync(bashPath ?? "bash", ["-c", "command -v rtk"], { encoding: "utf8", timeout: 5_000 });
    hasRtk = true;
} catch {
    hasRtk = false;
}

function pipeToHook(command, env) {
    try {
        const stdout = execFileSync(bashPath, [HOOK_PATH], {
            input: JSON.stringify({ tool_input: { command } }),
            encoding: "utf8",
            timeout: 15_000,
            env: env ?? process.env
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

function parseOutput(result) {
    if (!result.stdout.trim()) {
        return null;
    }
    return JSON.parse(result.stdout);
}

describe.skipIf(!bashPath)("rtk-rewrite", () => {
    describe.skipIf(!hasRtk)("with rtk installed", () => {
        it("should rewrite git status to rtk git status", () => {
            const result = pipeToHook("git status");
            expect(result.exitCode).toBe(0);

            const output = parseOutput(result);
            expect(output?.hookSpecificOutput?.updatedInput?.command).toBe("rtk git status");
        });

        it("should rewrite git diff --stat to rtk git diff --stat", () => {
            const result = pipeToHook("git diff --stat");
            expect(result.exitCode).toBe(0);

            const output = parseOutput(result);
            expect(output?.hookSpecificOutput?.updatedInput?.command).toBe("rtk git diff --stat");
        });

        it("should rewrite gh commands", () => {
            const result = pipeToHook("gh pr view 42");
            expect(result.exitCode).toBe(0);

            const output = parseOutput(result);
            expect(output?.hookSpecificOutput?.updatedInput?.command).toBe("rtk gh pr view 42");
        });

        it("should pass through commands already prefixed with rtk", () => {
            const result = pipeToHook("rtk git status");
            expect(result.exitCode).toBe(0);
            expect(result.stdout.trim()).toBe("");
        });

        it("should pass through commands without rtk support", () => {
            const result = pipeToHook("pnpm test");
            expect(result.exitCode).toBe(0);
            expect(result.stdout.trim()).toBe("");
        });
    });

    describe.skipIf(!hasRtk)("without rtk installed", () => {
        it("should pass through when rtk is not on PATH", () => {
            // Use Node's path.delimiter for cross-platform PATH splitting (`;` on Windows, `:` on Linux/macOS).
            // On Windows, resolve the native path via `where`; on Unix, `which` already returns the right format.
            const whichCmd = process.platform === "win32" ? "where rtk" : "which rtk";
            const rtkBin = execFileSync(bashPath, ["-c", whichCmd], { encoding: "utf8", timeout: 5_000 }).trim().split("\n")[0];
            const rtkDir = dirname(rtkBin);

            const filteredPath = process.env.PATH.split(delimiter)
                .filter(p => p.toLowerCase() !== rtkDir.toLowerCase())
                .join(delimiter);

            const result = pipeToHook("git status", { ...process.env, PATH: filteredPath });
            expect(result.exitCode).toBe(0);
            expect(result.stdout.trim()).toBe("");
        });
    });

    describe("input handling", () => {
        it("should skip heredocs", () => {
            const result = pipeToHook("cat <<EOF\nhello\nEOF");
            expect(result.exitCode).toBe(0);
            expect(result.stdout.trim()).toBe("");
        });

        it("should pass through empty commands", () => {
            const result = pipeToHook("");
            expect(result.exitCode).toBe(0);
            expect(result.stdout.trim()).toBe("");
        });
    });
});
