import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = resolve(__dirname, "../../src/adlc-verification/task-completed.mjs");

function pipeToHook(input) {
    try {
        const stdout = execFileSync(process.execPath, [HOOK_PATH], {
            input: JSON.stringify(input),
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

describe("task-completed hook (challenge arbiter)", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-tc-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should exit 0 for non-arbiter teammates", () => {
        const result = pipeToHook({ teammate_name: "_adlc-sprawl-challenger", cwd: tmp });
        expect(result.exitCode).toBe(0);
    });

    it("should exit 0 when teammate_name is missing", () => {
        const result = pipeToHook({ cwd: tmp });
        expect(result.exitCode).toBe(0);
    });

    it("should exit 0 when arbiter produced the verdict file", () => {
        writeFileSync(join(tmp, ".adlc/current-challenge-verdict.md"), "# Challenge Verdict\n\nContent here.");
        const result = pipeToHook({ teammate_name: "_adlc-challenge-arbiter", cwd: tmp });
        expect(result.exitCode).toBe(0);
    });

    it("should exit 2 when arbiter has no verdict file", () => {
        const result = pipeToHook({ teammate_name: "_adlc-challenge-arbiter", cwd: tmp });
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("current-challenge-verdict.md");
    });

    it("should exit 2 when verdict file is empty", () => {
        writeFileSync(join(tmp, ".adlc/current-challenge-verdict.md"), "");
        const result = pipeToHook({ teammate_name: "_adlc-challenge-arbiter", cwd: tmp });
        expect(result.exitCode).toBe(2);
    });
});
