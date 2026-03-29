import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_DIR = resolve(__dirname, "../../src/adlc-verification");
const REPO_ROOT = resolve(__dirname, "../../..");

function pipeToHook(input, timeout = 10_000) {
    try {
        const stdout = execFileSync(process.execPath, [resolve(HOOK_DIR, "subagent-stop.mjs")], {
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

describe("subagent-stop entry point", () => {
    it("should exit 0 with no output when stop_hook_active=true", () => {
        const result = pipeToHook({ agent_type: "_adlc-coder", cwd: REPO_ROOT, stop_hook_active: true });
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe("");
    });

    it("should exit 0 for unhandled agent type", () => {
        const result = pipeToHook({ agent_type: "_adlc", cwd: REPO_ROOT });
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe("");
    });

    it("should block _adlc-domain-mapper when domain-mapping.md missing", () => {
        const result = pipeToHook({ agent_type: "_adlc-domain-mapper", cwd: REPO_ROOT });
        if (existsSync(resolve(REPO_ROOT, ".adlc", "domain-mapping.md"))) {
            expect(result.exitCode).toBe(0);
        } else {
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed.decision).toBe("block");
        }
    });

    it("should exit 0 for _adlc-architect when no revision file exists and no plan artifacts present", () => {
        const result = pipeToHook({ agent_type: "_adlc-architect", cwd: REPO_ROOT });
        expect(result.exitCode).toBe(0);
        if (existsSync(resolve(REPO_ROOT, ".adlc", "plan-header.md"))) {
            // Plan artifacts from a real run are visible — noPlanMutations will block
            const parsed = JSON.parse(result.stdout);
            expect(parsed.decision).toBe("block");
        } else {
            expect(result.stdout.trim()).toBe("");
        }
    });

    it("should block _adlc-planner when plan-header.md missing", () => {
        const result = pipeToHook({ agent_type: "_adlc-planner", cwd: REPO_ROOT });
        if (existsSync(resolve(REPO_ROOT, ".adlc", "plan-header.md"))) {
            // If the file exists from a real run, just check valid output
            expect(result.exitCode).toBe(0);
        } else {
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed.decision).toBe("block");
        }
    });

    it("should block _adlc-reviewer when verification-results.md missing", () => {
        const result = pipeToHook({ agent_type: "_adlc-reviewer", cwd: REPO_ROOT });
        if (existsSync(resolve(REPO_ROOT, ".adlc", "verification-results.md"))) {
            expect(result.exitCode).toBe(0);
        } else {
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed.decision).toBe("block");
        }
    });

    it(
        "should run _adlc-simplify full pipeline and return valid output",
        () => {
            const result = pipeToHook({ agent_type: "_adlc-simplify", cwd: REPO_ROOT }, 5 * 60_000);

            if (result.exitCode === 0 && result.stdout.trim() === "") {
                expect(true).toBe(true);
            } else {
                expect(result.exitCode).toBe(0);
                const parsed = JSON.parse(result.stdout);
                expect(typeof parsed.decision).toBe("string");
                expect(typeof parsed.reason).toBe("string");
            }
        },
        5 * 60_000
    );

    it(
        "should run _adlc-coder full pipeline and return valid output",
        () => {
            const result = pipeToHook({ agent_type: "_adlc-coder", cwd: REPO_ROOT }, 5 * 60_000);

            if (result.exitCode === 0 && result.stdout.trim() === "") {
                // All checks passed
                expect(true).toBe(true);
            } else {
                expect(result.exitCode).toBe(0);
                const parsed = JSON.parse(result.stdout);
                expect(typeof parsed.decision).toBe("string");
                expect(typeof parsed.reason).toBe("string");
            }
        },
        5 * 60_000
    );
});
