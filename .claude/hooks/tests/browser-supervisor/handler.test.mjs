import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { THRESHOLD as CIRCUIT_BREAKER_THRESHOLD } from "../../src/browser-supervisor/circuit-breaker.mjs";
import { rewriteBareAgent } from "../../src/browser-supervisor/bare-rewrite.mjs";
import { evaluate, isBrowserCommand, isScreenshotCommand } from "../../src/browser-supervisor/handler.mjs";
import { readState, writeState } from "../../src/browser-supervisor/state.mjs";
import { BUDGET as TOTAL_BUDGET } from "../../src/browser-supervisor/total-budget.mjs";

// ── isBrowserCommand ───────────────────────────────────────

describe("isBrowserCommand", () => {
    it("should match standard agent-browser calls", () => {
        expect(isBrowserCommand("pnpm exec agent-browser snapshot -i -c")).toBe(true);
    });

    it("should match chained commands containing agent-browser", () => {
        expect(isBrowserCommand("sleep 8 && pnpm exec agent-browser open http://localhost:8080")).toBe(true);
    });

    it("should match --headed flag", () => {
        expect(isBrowserCommand("pnpm exec agent-browser --headed open http://localhost:8080")).toBe(true);
    });

    it("should not match non-browser commands", () => {
        expect(isBrowserCommand("git status")).toBe(false);
        expect(isBrowserCommand("pnpm install")).toBe(false);
        expect(isBrowserCommand("mkdir -p /tmp/test")).toBe(false);
    });

    it("should not match agent-browser as a substring in paths", () => {
        expect(isBrowserCommand("cat /tmp/agent-browser-log.txt")).toBe(false);
    });

    it("should handle empty command", () => {
        expect(isBrowserCommand("")).toBe(false);
    });
});

// ── rewriteBareAgent ──────────────────────────────────────

describe("rewriteBareAgent", () => {
    it("should rewrite bare agent-browser at start", () => {
        expect(rewriteBareAgent("agent-browser snapshot -i -c")).toBe("pnpm exec agent-browser snapshot -i -c");
    });

    it("should rewrite bare agent-browser after &&", () => {
        expect(rewriteBareAgent("cd /foo && agent-browser snapshot")).toBe("cd /foo && pnpm exec agent-browser snapshot");
    });

    it("should rewrite bare agent-browser after ;", () => {
        expect(rewriteBareAgent("sleep 1; agent-browser open http://localhost:8080")).toBe("sleep 1; pnpm exec agent-browser open http://localhost:8080");
    });

    it("should rewrite bare agent-browser after ||", () => {
        expect(rewriteBareAgent("false || agent-browser screenshot")).toBe("false || pnpm exec agent-browser screenshot");
    });

    it("should rewrite multiple bare invocations in a chain", () => {
        expect(rewriteBareAgent("agent-browser click @e7 && agent-browser screenshot"))
            .toBe("pnpm exec agent-browser click @e7 && pnpm exec agent-browser screenshot");
    });

    it("should return null when already using pnpm exec", () => {
        expect(rewriteBareAgent("pnpm exec agent-browser snapshot -i -c")).toBeNull();
    });

    it("should return null for non-browser commands", () => {
        expect(rewriteBareAgent("git status")).toBeNull();
    });

    it("should not rewrite agent-browser in file paths", () => {
        expect(rewriteBareAgent("cat /tmp/agent-browser-log.txt")).toBeNull();
    });
});

// ── isScreenshotCommand ────────────────────────────────────

describe("isScreenshotCommand", () => {
    it("should match screenshot commands", () => {
        expect(isScreenshotCommand("pnpm exec agent-browser screenshot 2>&1")).toBe(true);
    });

    it("should match screenshot in chained commands", () => {
        expect(isScreenshotCommand("pnpm exec agent-browser click @e7 && pnpm exec agent-browser screenshot")).toBe(true);
    });

    it("should not match snapshot commands", () => {
        expect(isScreenshotCommand("pnpm exec agent-browser snapshot -i -c")).toBe(false);
    });

    it("should not match non-browser commands", () => {
        expect(isScreenshotCommand("git status")).toBe(false);
    });
});

// ── readState / writeState ─────────────────────────────────

describe("readState / writeState", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "bs-state-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should return defaults when state file does not exist", () => {
        const state = readState(tmp);
        expect(state.consecutiveBrowserCalls).toBe(0);
        expect(state.totalBrowserCalls).toBe(0);
        expect(state.screenshotNudgeFired).toBe(false);
    });

    it("should return defaults when state file is malformed", () => {
        writeFileSync(join(tmp, ".adlc/supervisor-state.json"), "not json");
        const state = readState(tmp);
        expect(state.consecutiveBrowserCalls).toBe(0);
    });

    it("should round-trip state", () => {
        const state = { consecutiveBrowserCalls: 5, totalBrowserCalls: 12, screenshotNudgeFired: true };
        writeState(tmp, state);
        const loaded = readState(tmp);
        expect(loaded).toEqual(state);
    });
});

// ── evaluate: non-browser commands ─────────────────────────

describe("evaluate — non-browser commands", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "bs-eval-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should allow non-browser commands", () => {
        expect(evaluate("Bash", "git status", tmp)).toEqual({ action: "allow" });
    });

    it("should reset consecutive counter on non-browser command", () => {
        // Simulate 5 browser calls
        writeState(tmp, { consecutiveBrowserCalls: 5, totalBrowserCalls: 5, screenshotNudgeFired: false });

        evaluate("Bash", "pnpm install", tmp);

        const state = readState(tmp);
        expect(state.consecutiveBrowserCalls).toBe(0);
        expect(state.totalBrowserCalls).toBe(5); // preserved
    });

    it("should not write state if consecutive counter is already 0", () => {
        evaluate("Bash", "git status", tmp);

        // No state file should be created when counter was already 0
        let fileExists = true;
        try {
            readFileSync(join(tmp, ".adlc/supervisor-state.json"));
        } catch {
            fileExists = false;
        }

        expect(fileExists).toBe(false);
    });

    it("should reset consecutive counter on Read tool call", () => {
        writeState(tmp, { consecutiveBrowserCalls: 5, totalBrowserCalls: 5, screenshotNudgeFired: false });

        evaluate("Read", "", tmp);

        const state = readState(tmp);
        expect(state.consecutiveBrowserCalls).toBe(0);
        expect(state.totalBrowserCalls).toBe(5);
    });

    it("should reset consecutive counter on Write tool call", () => {
        writeState(tmp, { consecutiveBrowserCalls: 7, totalBrowserCalls: 10, screenshotNudgeFired: false });

        evaluate("Write", "", tmp);

        expect(readState(tmp).consecutiveBrowserCalls).toBe(0);
    });

    it("should reset consecutive counter on Edit tool call", () => {
        writeState(tmp, { consecutiveBrowserCalls: 3, totalBrowserCalls: 8, screenshotNudgeFired: false });

        evaluate("Edit", "", tmp);

        expect(readState(tmp).consecutiveBrowserCalls).toBe(0);
    });
});

// ── evaluate: screenshot nudge ─────────────────────────────

describe("evaluate — screenshot nudge", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "bs-nudge-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should block first screenshot with nudge", () => {
        const result = evaluate("Bash", "pnpm exec agent-browser screenshot 2>&1", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("diff snapshot");
        expect(result.reason).toContain("eval --stdin");
        expect(result.reason).toContain("is visible");
    });

    it("should allow second screenshot (nudge already fired)", () => {
        evaluate("Bash", "pnpm exec agent-browser screenshot", tmp);
        const result = evaluate("Bash", "pnpm exec agent-browser screenshot", tmp);
        expect(result.action).toBe("allow");
    });

    it("should not nudge on non-screenshot browser commands", () => {
        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.action).toBe("allow");
    });

    it("should still increment counters when nudge fires", () => {
        evaluate("Bash", "pnpm exec agent-browser screenshot", tmp);
        const state = readState(tmp);
        expect(state.totalBrowserCalls).toBe(1);
        expect(state.consecutiveBrowserCalls).toBe(1);
        expect(state.screenshotNudgeFired).toBe(true);
    });
});

// ── evaluate: circuit breaker ──────────────────────────────

describe("evaluate — circuit breaker", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "bs-breaker-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should allow calls under the threshold", () => {
        for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD - 1; i++) {
            expect(evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp).action).toBe("allow");
        }
    });

    it("should block at the threshold", () => {
        // Exhaust nudge first so it doesn't interfere
        writeState(tmp, { consecutiveBrowserCalls: 0, totalBrowserCalls: 0, screenshotNudgeFired: true });

        for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD - 1; i++) {
            evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        }

        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("consecutive browser calls");
        expect(result.reason).toContain("debugging spiral");
    });

    it("should reset after a non-browser command and re-fire", () => {
        writeState(tmp, { consecutiveBrowserCalls: 0, totalBrowserCalls: 0, screenshotNudgeFired: true });

        // Hit threshold
        for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD; i++) {
            evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        }

        // Non-browser resets consecutive
        evaluate("Bash", "pnpm install", tmp);
        expect(readState(tmp).consecutiveBrowserCalls).toBe(0);

        // Should allow again up to threshold
        for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD - 1; i++) {
            expect(evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp).action).toBe("allow");
        }

        // Fires again at threshold
        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.action).toBe("block");
    });

    it("should include diagnostic steps in the message", () => {
        writeState(tmp, {
            consecutiveBrowserCalls: CIRCUIT_BREAKER_THRESHOLD - 1,
            totalBrowserCalls: CIRCUIT_BREAKER_THRESHOLD - 1,
            screenshotNudgeFired: true
        });

        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.reason).toContain("errors");
        expect(result.reason).toContain("diff snapshot");
        expect(result.reason).toContain("re-read the source");
    });
});

// ── evaluate: total budget ─────────────────────────────────

describe("evaluate — total budget", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "bs-budget-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should allow calls under the budget", () => {
        writeState(tmp, { consecutiveBrowserCalls: 0, totalBrowserCalls: TOTAL_BUDGET - 1, screenshotNudgeFired: true });
        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.action).toBe("allow");
    });

    it("should block when budget is exceeded", () => {
        writeState(tmp, { consecutiveBrowserCalls: 0, totalBrowserCalls: TOTAL_BUDGET, screenshotNudgeFired: true });
        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("budget exceeded");
        expect(result.reason).toContain(`${TOTAL_BUDGET + 1}/${TOTAL_BUDGET}`);
    });

    it("should stay blocked even after non-browser interleaving", () => {
        writeState(tmp, { consecutiveBrowserCalls: 5, totalBrowserCalls: TOTAL_BUDGET, screenshotNudgeFired: true });

        // Non-browser resets consecutive but not total
        evaluate("Bash", "git status", tmp);

        const result = evaluate("Bash", "pnpm exec agent-browser snapshot -i -c", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("budget exceeded");
    });
});

// ── evaluate: priority ─────────────────────────────────────

describe("evaluate — priority", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "bs-priority-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should prefer budget over circuit breaker", () => {
        writeState(tmp, {
            consecutiveBrowserCalls: CIRCUIT_BREAKER_THRESHOLD - 1,
            totalBrowserCalls: TOTAL_BUDGET,
            screenshotNudgeFired: true
        });

        const result = evaluate("Bash", "pnpm exec agent-browser snapshot", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("budget exceeded");
    });

    it("should prefer circuit breaker over screenshot nudge", () => {
        writeState(tmp, {
            consecutiveBrowserCalls: CIRCUIT_BREAKER_THRESHOLD - 1,
            totalBrowserCalls: 0,
            screenshotNudgeFired: false
        });

        const result = evaluate("Bash", "pnpm exec agent-browser screenshot", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("consecutive browser calls");
    });

    it("should fire screenshot nudge when no other control triggers", () => {
        const result = evaluate("Bash", "pnpm exec agent-browser screenshot", tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("diff snapshot");
    });
});
