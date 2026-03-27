import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { handlePreTool } from "../../src/supervisor/handler.mjs";
import { BROWSER_CIRCUIT_BREAKER_THRESHOLD, BROWSER_TOTAL_BUDGET } from "../../src/supervisor/policies/browser-thrash.mjs";
import { REPEATED_EDIT_THRESHOLD } from "../../src/supervisor/policies/repeated-edit.mjs";
import { TOOL_THRASH_THRESHOLD } from "../../src/supervisor/policies/tool-call-thrash.mjs";
import { readRecovery } from "../../src/supervisor/recovery.mjs";
import { readState, writeState } from "../../src/supervisor/state.mjs";

describe("supervisor handler", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "supervisor-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("fires the screenshot nudge once and tracks browser counters", () => {
        const first = handlePreTool("Bash", { command: "pnpm exec agent-browser screenshot" }, tmp);
        expect(first.action).toBe("block");
        expect(first.reason).toContain("prefer DOM queries over screenshots");

        const second = handlePreTool("Bash", { command: "pnpm exec agent-browser screenshot" }, tmp);
        expect(second).toEqual({ action: "allow" });

        const state = readState(tmp);
        expect(state.browser.totalCalls).toBe(2);
        expect(state.browser.consecutiveCalls).toBe(2);
        expect(state.browser.screenshotNudgeFired).toBe(true);
    });

    it("blocks at the browser circuit breaker threshold", () => {
        writeState(tmp, {
            ...readState(tmp),
            browser: {
                consecutiveCalls: BROWSER_CIRCUIT_BREAKER_THRESHOLD - 1,
                totalCalls: BROWSER_CIRCUIT_BREAKER_THRESHOLD - 1,
                screenshotNudgeFired: true
            }
        });

        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("debugging spiral");
    });

    it("blocks when the browser budget is exceeded", () => {
        writeState(tmp, {
            ...readState(tmp),
            browser: {
                consecutiveCalls: 0,
                totalCalls: BROWSER_TOTAL_BUDGET,
                screenshotNudgeFired: true
            }
        });

        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("browser call budget exceeded");
    });

    it("creates and enforces repeated-edit recovery contracts", () => {
        for (let index = 0; index < REPEATED_EDIT_THRESHOLD - 1; index += 1) {
            expect(handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp)).toEqual({
                action: "allow"
            });
        }

        const trigger = handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        expect(trigger.action).toBe("block");
        expect(trigger.reason).toContain("Repeated edit loop detected");

        const recovery = readRecovery(tmp);
        expect(recovery.policy).toBe("repeated-edit");
        expect(recovery.blockedTargets).toContain("apps/management/plants/src/PlantsPage.tsx");

        const blocked = handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("recovery is active");

        expect(handlePreTool("Write", { file_path: ".adlc/supervisor-recovery.md" }, tmp)).toEqual({ action: "allow" });
        expect(handlePreTool("Bash", { command: "git diff --stat" }, tmp)).toEqual({ action: "allow" });
        expect(readRecovery(tmp)).toBeNull();

        expect(handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp)).toEqual({
            action: "allow"
        });
    });

    it("creates and clears tool-call-thrash recovery contracts", () => {
        for (let index = 0; index < TOOL_THRASH_THRESHOLD - 1; index += 1) {
            expect(handlePreTool("Bash", { command: "pnpm lint --filter plants" }, tmp)).toEqual({ action: "allow" });
        }

        const trigger = handlePreTool("Bash", { command: "pnpm lint --filter plants" }, tmp);
        expect(trigger.action).toBe("block");
        expect(trigger.reason).toContain("Repeated command thrash detected");

        const blocked = handlePreTool("Bash", { command: "pnpm lint --filter plants" }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("recovery is active");

        expect(handlePreTool("Read", { file_path: "packages/components/src/index.ts" }, tmp)).toEqual({ action: "allow" });
        expect(readRecovery(tmp)).toBeNull();
        expect(handlePreTool("Bash", { command: "pnpm lint --filter plants" }, tmp)).toEqual({ action: "allow" });
    });

    it("logs events to .adlc/supervisor-events.jsonl", () => {
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        handlePreTool("Bash", { command: "git status" }, tmp);

        const log = readFileSync(join(tmp, ".adlc", "supervisor-events.jsonl"), "utf8")
            .trim()
            .split("\n");
        expect(log).toHaveLength(2);

        const firstEvent = JSON.parse(log[0]);
        const secondEvent = JSON.parse(log[1]);
        expect(firstEvent.toolName).toBe("Read");
        expect(secondEvent.commandFingerprint).toBe("git status");
    });

    it("resets browser consecutive calls on non-browser tool activity", () => {
        handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);

        expect(readState(tmp).browser.consecutiveCalls).toBe(2);

        handlePreTool("Read", { file_path: "README.md" }, tmp);
        expect(readState(tmp).browser.consecutiveCalls).toBe(0);
    });

    it("escalates after maxAttempts recoveries for the same policy", () => {
        const CMD = { command: "pnpm test --run" };

        // First recovery cycle — attempt 1
        for (let index = 0; index < TOOL_THRASH_THRESHOLD - 1; index += 1) {
            expect(handlePreTool("Bash", CMD, tmp)).toEqual({ action: "allow" });
        }
        const trigger1 = handlePreTool("Bash", CMD, tmp);
        expect(trigger1.action).toBe("block");
        expect(trigger1.reason).toContain("Repeated command thrash");
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        expect(readRecovery(tmp)).toBeNull();

        // Second recovery cycle — attempt 2
        for (let index = 0; index < TOOL_THRASH_THRESHOLD - 1; index += 1) {
            expect(handlePreTool("Bash", CMD, tmp)).toEqual({ action: "allow" });
        }
        const trigger2 = handlePreTool("Bash", CMD, tmp);
        expect(trigger2.action).toBe("block");
        expect(trigger2.reason).toContain("Repeated command thrash");
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        expect(readRecovery(tmp)).toBeNull();

        // Third trigger — attempt 3 > maxAttempts 2 → escalation
        for (let index = 0; index < TOOL_THRASH_THRESHOLD - 1; index += 1) {
            expect(handlePreTool("Bash", CMD, tmp)).toEqual({ action: "allow" });
        }
        const escalation = handlePreTool("Bash", CMD, tmp);
        expect(escalation.action).toBe("block");
        expect(escalation.severity).toBe("escalate");
        expect(escalation.reason).toContain("recovery exceeded");
        expect(readRecovery(tmp)).toBeNull();
    });

    it("tracks recovery artifacts on disk", () => {
        handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        handlePreTool("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);

        const stats = statSync(join(tmp, ".adlc", "supervisor-recovery.json"));
        expect(stats.isFile()).toBe(true);

        writeFileSync(join(tmp, ".adlc", "supervisor-recovery.md"), "# diagnosis\n");
        expect(statSync(join(tmp, ".adlc", "supervisor-recovery.md")).isFile()).toBe(true);
    });
});
