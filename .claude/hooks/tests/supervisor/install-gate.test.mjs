import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { handlePostTool, handlePreTool } from "../../src/supervisor/handler.mjs";
import { INSTALL_BYPASS_EVENT_TTL } from "../../src/supervisor/policies/install-gate.mjs";
import { readState } from "../../src/supervisor/state.mjs";

describe("supervisor install gate", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "supervisor-install-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
        writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "install-gate-test", private: true }, null, 2) + "\n");

        execSync("git init", { cwd: tmp, stdio: "ignore" });
        execSync("git config user.email test@test.com", { cwd: tmp, stdio: "ignore" });
        execSync("git config user.name test", { cwd: tmp, stdio: "ignore" });
        execSync("git add package.json", { cwd: tmp, stdio: "ignore" });
        execSync('git commit -m "init"', { cwd: tmp, stdio: "ignore" });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("blocks pnpm install by default", () => {
        const result = handlePreTool("Bash", { command: "pnpm install" }, tmp);

        expect(result.action).toBe("block");
        expect(result.reason).toContain(".adlc/allow-install");
    });

    it("allows pnpm install when package.json differs from HEAD", () => {
        writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "install-gate-test", private: true, version: "1.0.0" }, null, 2) + "\n");

        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp)).toEqual({ action: "allow" });
    });

    it("allows pnpm install when a new manifest is untracked", () => {
        mkdirSync(join(tmp, "packages", "new-package"), { recursive: true });
        writeFileSync(
            join(tmp, "packages", "new-package", "package.json"),
            JSON.stringify({ name: "@repo/new-package", private: true }, null, 2) + "\n"
        );

        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp)).toEqual({ action: "allow" });
    });

    it("allows pnpm install when an explicit override marker exists", () => {
        writeFileSync(join(tmp, ".adlc", "allow-install"), "stale workspace install approved\n");

        expect(handlePreTool("Bash", { command: "pnpm i" }, tmp)).toEqual({ action: "allow" });
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp)).toEqual({ action: "allow" });

        const events = readEvents(tmp);
        expect(events.at(-1).outcome).toBe("install-override-allowed");
        expect(events.at(-1).reason).toBe("stale workspace install approved");
    });

    it("blocks pnpm install when the override file is empty", () => {
        writeFileSync(join(tmp, ".adlc", "allow-install"), "\n");

        const result = handlePreTool("Bash", { command: "pnpm install" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain(".adlc/allow-install");
    });

    it("records dependency evidence and consumes the bypass after one install", () => {
        handlePreTool("Bash", { command: "pnpm dev-host" }, tmp);
        handlePostTool("Bash", { command: "pnpm dev-host" }, tmp, {
            tool_response: {
                stderr: "Error: Cannot find module '@plants/new-dep'"
            }
        });

        const stateAfterEvidence = readState(tmp);
        expect(stateAfterEvidence.installBypass?.active).toBe(true);
        expect(stateAfterEvidence.installBypass?.remainingUses).toBe(1);
        expect(readEvidenceEvents(tmp)).toContain("install-bypass-granted");

        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp)).toEqual({ action: "allow" });
        expect(readState(tmp).installBypass).toBeNull();

        const blockedAgain = handlePreTool("Bash", { command: "pnpm install" }, tmp);
        expect(blockedAgain.action).toBe("block");
    });

    it("does not create a bypass for generic failures", () => {
        handlePreTool("Bash", { command: "pnpm lint" }, tmp);
        handlePostTool("Bash", { command: "pnpm lint" }, tmp, {
            error: {
                message: "Found 14 type errors"
            }
        });

        expect(readState(tmp).installBypass).toBeNull();
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp).action).toBe("block");
    });

    it("does not create a bypass for missing relative imports", () => {
        handlePreTool("Bash", { command: "pnpm dev-host" }, tmp);
        handlePostTool("Bash", { command: "pnpm dev-host" }, tmp, {
            tool_response: {
                stderr: "Error: Cannot find module './local-file'"
            }
        });

        expect(readState(tmp).installBypass).toBeNull();
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp).action).toBe("block");
    });

    it("does not create a bypass for missing pnpm scripts or typos", () => {
        handlePreTool("Bash", { command: "pnpm dev-hsot" }, tmp);
        handlePostTool("Bash", { command: "pnpm dev-hsot" }, tmp, {
            error: {
                message: 'Command "dev-hsot" not found'
            }
        });

        expect(readState(tmp).installBypass).toBeNull();
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp).action).toBe("block");
    });

    it("does not create a bypass for alias-style imports", () => {
        handlePreTool("Bash", { command: "pnpm dev-host" }, tmp);
        handlePostTool("Bash", { command: "pnpm dev-host" }, tmp, {
            tool_response: {
                stderr: "Error: Cannot find module '@/components/Button'"
            }
        });

        expect(readState(tmp).installBypass).toBeNull();
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp).action).toBe("block");
    });

    it("expires the evidence bypass after a short event window", () => {
        handlePreTool("Bash", { command: "pnpm dev-host" }, tmp);
        handlePostTool("Bash", { command: "pnpm dev-host" }, tmp, {
            error: {
                message: "Cannot find package 'vite' imported from /repo/apps/host/rsbuild.config.ts"
            }
        });

        for (let index = 0; index < INSTALL_BYPASS_EVENT_TTL; index += 1) {
            expect(handlePreTool("Read", { file_path: `README-${index}.md` }, tmp)).toEqual({ action: "allow" });
        }

        const result = handlePreTool("Bash", { command: "pnpm install" }, tmp);
        expect(result.action).toBe("block");
        expect(readState(tmp).installBypass).toBeNull();
    });

    it("logs post-tool evidence events with unique increasing indexes", () => {
        handlePreTool("Bash", { command: "pnpm dev-host" }, tmp);
        handlePostTool("Bash", { command: "pnpm dev-host" }, tmp, {
            tool_response: {
                stderr: "Error: Cannot find module '@plants/new-dep'"
            }
        });

        const events = readEvents(tmp);
        expect(events).toHaveLength(2);
        expect(events[0].index).toBe(1);
        expect(events[1].index).toBeGreaterThan(events[0].index);
        expect(events[1].outcome).toBe("install-bypass-granted");
    });

    it("counts blocked install attempts toward supervisor state", () => {
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp).action).toBe("block");
        expect(handlePreTool("Bash", { command: "pnpm install" }, tmp).action).toBe("block");

        const state = readState(tmp);
        expect(state.eventCount).toBe(2);
        expect(state.recentEvents).toHaveLength(2);
        expect(state.toolThrash.repeatCount).toBe(2);
    });
});

function readEvidenceEvents(cwd) {
    return readFileSync(join(cwd, ".adlc", "supervisor-events.jsonl"), "utf8");
}

function readEvents(cwd) {
    return readEvidenceEvents(cwd)
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(line => JSON.parse(line));
}
