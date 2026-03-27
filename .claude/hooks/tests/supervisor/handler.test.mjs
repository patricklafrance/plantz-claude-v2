import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { evaluate } from "../../src/supervisor/handler.mjs";
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
        const first = evaluate("Bash", { command: "pnpm exec agent-browser screenshot" }, tmp);
        expect(first.action).toBe("block");
        expect(first.reason).toContain("prefer DOM queries over screenshots");

        const second = evaluate("Bash", { command: "pnpm exec agent-browser screenshot" }, tmp);
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

        const result = evaluate("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
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

        const result = evaluate("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("browser call budget exceeded");
    });

    it("creates and enforces repeated-edit recovery contracts", () => {
        for (let index = 0; index < REPEATED_EDIT_THRESHOLD - 1; index += 1) {
            expect(evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp)).toEqual({
                action: "allow"
            });
        }

        const trigger = evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        expect(trigger.action).toBe("block");
        expect(trigger.reason).toContain("Repeated edit loop detected");

        const recovery = readRecovery(tmp);
        expect(recovery.policy).toBe("repeated-edit");
        expect(recovery.blockedTargets).toContain("apps/management/plants/src/PlantsPage.tsx");

        const blocked = evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("recovery is active");

        expect(evaluate("Write", { file_path: ".adlc/supervisor-recovery.md" }, tmp)).toEqual({ action: "allow" });
        expect(evaluate("Bash", { command: "git diff --stat" }, tmp)).toEqual({ action: "allow" });
        expect(readRecovery(tmp)).toBeNull();

        expect(evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp)).toEqual({
            action: "allow"
        });
    });

    it("creates and clears tool-call-thrash recovery contracts", () => {
        for (let index = 0; index < TOOL_THRASH_THRESHOLD - 1; index += 1) {
            expect(evaluate("Bash", { command: "pnpm lint --filter plants" }, tmp)).toEqual({ action: "allow" });
        }

        const trigger = evaluate("Bash", { command: "pnpm lint --filter plants" }, tmp);
        expect(trigger.action).toBe("block");
        expect(trigger.reason).toContain("Repeated command thrash detected");

        const blocked = evaluate("Bash", { command: "pnpm lint --filter plants" }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("recovery is active");

        expect(evaluate("Read", { file_path: "packages/components/src/index.ts" }, tmp)).toEqual({ action: "allow" });
        expect(readRecovery(tmp)).toBeNull();
        expect(evaluate("Bash", { command: "pnpm lint --filter plants" }, tmp)).toEqual({ action: "allow" });
    });

    it("logs events to .adlc/supervisor-events.jsonl", () => {
        evaluate("Read", { file_path: "README.md" }, tmp);
        evaluate("Bash", { command: "git status" }, tmp);

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
        evaluate("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        evaluate("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);

        expect(readState(tmp).browser.consecutiveCalls).toBe(2);

        evaluate("Read", { file_path: "README.md" }, tmp);
        expect(readState(tmp).browser.consecutiveCalls).toBe(0);
    });

    it("tracks recovery artifacts on disk", () => {
        evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);
        evaluate("Edit", { file_path: "apps/management/plants/src/PlantsPage.tsx" }, tmp);

        const stats = statSync(join(tmp, ".adlc", "supervisor-recovery.json"));
        expect(stats.isFile()).toBe(true);

        writeFileSync(join(tmp, ".adlc", "supervisor-recovery.md"), "# diagnosis\n");
        expect(statSync(join(tmp, ".adlc", "supervisor-recovery.md")).isFile()).toBe(true);
    });
});
