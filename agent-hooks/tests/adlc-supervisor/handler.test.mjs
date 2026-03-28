import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { handlePreTool } from "../../src/adlc-supervisor/handler.mjs";
import { BROWSER_CIRCUIT_BREAKER_THRESHOLD, BROWSER_TOTAL_BUDGET } from "../../src/adlc-supervisor/policies/browser-thrash.mjs";
import { readState, writeState } from "../../src/adlc-supervisor/state.mjs";

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

    it("sets startedAt on first event", () => {
        expect(readState(tmp).startedAt).toBeNull();

        handlePreTool("Read", { file_path: "README.md" }, tmp);

        const state = readState(tmp);
        expect(state.startedAt).toBeTruthy();
        expect(new Date(state.startedAt).getTime()).toBeGreaterThan(0);
    });
});
