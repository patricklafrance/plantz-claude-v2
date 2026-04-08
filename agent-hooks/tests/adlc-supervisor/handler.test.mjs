import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { handlePreTool } from "../../src/adlc-supervisor/handler.mjs";
import { BROWSER_DENSITY_MIN_CALLS, BROWSER_TOTAL_BUDGET, SAME_TARGET_THRESHOLD } from "../../src/adlc-supervisor/policies/browser-thrash.mjs";
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

    // --- Screenshot nudge ---

    it("fires the screenshot nudge once and tracks browser counters", () => {
        const first = handlePreTool("Bash", { command: "pnpm exec agent-browser screenshot" }, tmp);
        expect(first.action).toBe("block");
        expect(first.reason).toContain("prefer DOM queries over screenshots");

        const second = handlePreTool("Bash", { command: "pnpm exec agent-browser screenshot" }, tmp);
        expect(second).toEqual({ action: "allow" });

        const state = readState(tmp);
        expect(state.browser.totalCalls).toBe(2);
        expect(state.browser.screenshotNudgeFired).toBe(true);
    });

    // --- Density-based detection ---

    it("does not trigger density detection below minimum calls", () => {
        // Fire browser calls but stay under BROWSER_DENSITY_MIN_CALLS.
        // The Nth call triggers density, so N-1 calls should all be allowed.
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS - 1; i++) {
            const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
            expect(result.action).toBe("allow");
        }

        expect(readState(tmp).browser.recoveryTier).toBe(0);
    });

    it("triggers tier 1 recovery when density exceeds threshold", () => {
        // Fire N-1 browser calls (all allowed because totalCalls < min threshold).
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS - 1; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }

        // The Nth call pushes totalCalls to BROWSER_DENSITY_MIN_CALLS, activating
        // density detection. With 100% browser density, this triggers tier 1.
        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("Browser stuck detected");
        expect(result.reason).toContain("_browser-recovery");

        const state = readState(tmp);
        expect(state.browser.recoveryTier).toBe(1);
        expect(state.browser.nonBrowserSinceRecovery).toBe(0);
    });

    it("escalates to tier 2 on second density trigger after recovery", () => {
        // Set up state as if tier 1 was already triggered and gate was satisfied.
        // recentEvents is empty (cleared by recovery handler).
        const state = readState(tmp);
        state.browser.recoveryTier = 1;
        state.browser.nonBrowserSinceRecovery = 3; // gate satisfied for tier 1
        state.browser.totalCalls = BROWSER_DENSITY_MIN_CALLS;
        state.browser.screenshotNudgeFired = true;
        writeState(tmp, state);

        // Fire 3 browser calls — density stays at 0 because window has < 4 events.
        for (let i = 0; i < 3; i++) {
            const r = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
            expect(r.action).toBe("allow");
        }

        // 4th browser call: density = 4/4 = 1.0, triggers tier 2.
        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("AGAIN after recovery");
        expect(readState(tmp).browser.recoveryTier).toBe(2);
    });

    // --- Non-browser gate enforcement ---

    it("enforces non-browser gate after tier 1 recovery", () => {
        // Trigger tier 1.
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS - 1; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }
        handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);

        // Browser call should be gated (3 non-browser calls required for tier 1).
        const blocked1 = handlePreTool("Bash", { command: "pnpm exec agent-browser eval document.title" }, tmp);
        expect(blocked1.action).toBe("block");
        expect(blocked1.reason).toContain("3 more non-browser tool calls required");

        // Do 2 non-browser calls (not enough).
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        handlePreTool("Read", { file_path: "package.json" }, tmp);

        const blocked2 = handlePreTool("Bash", { command: "pnpm exec agent-browser eval document.title" }, tmp);
        expect(blocked2.action).toBe("block");
        expect(blocked2.reason).toContain("1 more non-browser tool call required");

        // Third non-browser call clears the gate.
        handlePreTool("Read", { file_path: "tsconfig.json" }, tmp);

        // Gate cleared — browser allowed (density is low in the fresh window).
        const allowed = handlePreTool("Bash", { command: "pnpm exec agent-browser eval document.title" }, tmp);
        expect(allowed.action).toBe("allow");
    });

    it("enforces stronger gate after tier 2 recovery", () => {
        // Set up state directly at tier 2.
        const state = readState(tmp);
        state.browser.recoveryTier = 2;
        state.browser.nonBrowserSinceRecovery = 0;
        state.browser.totalCalls = 20;
        state.browser.screenshotNudgeFired = true;
        writeState(tmp, state);

        // Browser should be gated (5 non-browser calls required for tier 2).
        const blocked = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("5 more non-browser tool calls required");

        // Do 4 non-browser calls (not enough).
        for (let i = 0; i < 4; i++) {
            handlePreTool("Read", { file_path: `file${i}.md` }, tmp);
        }

        const stillBlocked = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(stillBlocked.action).toBe("block");
        expect(stillBlocked.reason).toContain("1 more non-browser tool call required");

        // 5th non-browser call clears the gate.
        handlePreTool("Read", { file_path: "file5.md" }, tmp);

        const allowed = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(allowed.action).toBe("allow");
    });

    // --- Total budget ---

    it("blocks with tier 2 recovery when browser budget is exceeded", () => {
        const state = readState(tmp);
        state.browser.totalCalls = BROWSER_TOTAL_BUDGET + 1;
        state.browser.screenshotNudgeFired = true;
        writeState(tmp, state);

        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("budget exceeded");
    });

    it("allows browser after gate clears even when over budget", () => {
        // Over budget, but gate satisfied and density low (empty window).
        const state = readState(tmp);
        state.browser.totalCalls = BROWSER_TOTAL_BUDGET + 1;
        state.browser.recoveryTier = 2;
        state.browser.nonBrowserSinceRecovery = 5; // gate satisfied
        state.browser.screenshotNudgeFired = true;
        state.recentEvents = [];
        writeState(tmp, state);

        // Gate satisfied, density is 0 (empty window), but totalCalls > budget.
        // Budget fires tier 2 recovery.
        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("budget exceeded");
    });

    // --- Block message content ---

    it("includes recent browser fingerprints in tier 1 block message", () => {
        // Trigger tier 1 — the Nth call fires the density message.
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS - 1; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }

        const result = handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        expect(result.reason).toContain("Recent browser commands:");
        expect(result.reason).toContain("pnpm exec agent-browser");
    });

    // --- Same-target repetition detection ---

    it("triggers recovery when same-page browser calls reach threshold", () => {
        // Suppress the screenshot nudge first.
        handlePreTool("Bash", { command: "agent-browser screenshot" }, tmp);

        // Open a page, then probe it repeatedly.
        handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/foo--bar" }, tmp);

        for (let i = 0; i < SAME_TARGET_THRESHOLD - 2; i++) {
            // Interleave Read calls (like viewing screenshots) — these should NOT reset the counter.
            handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
            const result = handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
            expect(result.action).toBe("allow");
        }

        // Next browser call crosses the threshold.
        const result = handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("Same-page repetition detected");
        expect(result.reason).toContain("_browser-recovery");
    });

    it("resets repetition counter when a different URL is opened", () => {
        handlePreTool("Bash", { command: "agent-browser screenshot" }, tmp); // nudge

        // Open page A, probe it near threshold — interleave Reads to avoid density trigger.
        handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/foo--bar" }, tmp);
        for (let i = 0; i < SAME_TARGET_THRESHOLD - 3; i++) {
            handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
            handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
        }

        // Open a DIFFERENT URL — resets the counter.
        handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
        handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/other--story" }, tmp);

        // Continue probing the new page — should have a fresh count.
        for (let i = 0; i < SAME_TARGET_THRESHOLD - 3; i++) {
            handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
            const result = handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
            expect(result.action).toBe("allow");
        }

        expect(readState(tmp).browser.sameTargetCalls).toBeLessThan(SAME_TARGET_THRESHOLD);
    });

    it("resets repetition counter on Edit", () => {
        handlePreTool("Bash", { command: "agent-browser screenshot" }, tmp); // nudge

        // Probe a page near threshold — interleave Reads to avoid density trigger.
        handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/foo--bar" }, tmp);
        for (let i = 0; i < SAME_TARGET_THRESHOLD - 3; i++) {
            handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
            handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
        }

        // Edit a file — agent is making progress, counter resets.
        handlePreTool("Edit", { file_path: "src/Component.tsx", old_string: "a", new_string: "b" }, tmp);
        expect(readState(tmp).browser.sameTargetCalls).toBe(0);

        // Can resume browser work without triggering.
        const result = handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
        expect(result.action).toBe("allow");
    });

    it("does not count open command toward previous target when URL changes", () => {
        handlePreTool("Bash", { command: "agent-browser screenshot" }, tmp); // nudge

        // Open page A, probe it near threshold — interleave Reads to avoid density trigger.
        handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/page-a" }, tmp);
        for (let i = 0; i < SAME_TARGET_THRESHOLD - 3; i++) {
            handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
            handlePreTool("Bash", { command: "agent-browser eval document.title" }, tmp);
        }

        // Open page B — should NOT trigger even though total browser calls are high.
        handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
        const result = handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/page-b" }, tmp);
        expect(result.action).toBe("allow");
        expect(readState(tmp).browser.sameTargetCalls).toBe(1);
    });

    it("counts reopening the same URL as repetition", () => {
        handlePreTool("Bash", { command: "agent-browser screenshot" }, tmp); // nudge

        // Open the same URL repeatedly — interleave Reads to avoid density trigger.
        // The open that pushes sameTargetCalls to SAME_TARGET_THRESHOLD should trigger.
        for (let i = 0; i < SAME_TARGET_THRESHOLD - 1; i++) {
            handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
            handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/foo--bar" }, tmp);
        }

        // This open is the Nth call on the same target — triggers repetition.
        handlePreTool("Read", { file_path: "screenshot.png" }, tmp);
        const result = handlePreTool("Bash", { command: "agent-browser open http://localhost:6006/?path=/story/foo--bar" }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("Same-page repetition detected");
    });

    // --- Event logging ---

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

    // --- State tracking ---

    it("increments nonBrowserSinceRecovery on non-browser calls", () => {
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        handlePreTool("Bash", { command: "git status" }, tmp);
        handlePreTool("Read", { file_path: "package.json" }, tmp);

        const state = readState(tmp);
        expect(state.browser.nonBrowserSinceRecovery).toBe(3);
    });

    it("resets nonBrowserSinceRecovery when recovery triggers", () => {
        // Build up non-browser calls first.
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        expect(readState(tmp).browser.nonBrowserSinceRecovery).toBe(2);

        // Trigger density recovery — resets counter.
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }

        expect(readState(tmp).browser.nonBrowserSinceRecovery).toBe(0);
        expect(readState(tmp).browser.recoveryTier).toBe(1);
    });

    it("clears recentEvents when recovery triggers", () => {
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }

        // Recovery triggered — recentEvents should be cleared.
        expect(readState(tmp).recentEvents).toEqual([]);
    });

    it("does not reset nonBrowserSinceRecovery on gate blocks", () => {
        // Trigger tier 1.
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS - 1; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }
        handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);

        // Do 2 non-browser calls.
        handlePreTool("Read", { file_path: "README.md" }, tmp);
        handlePreTool("Read", { file_path: "package.json" }, tmp);
        expect(readState(tmp).browser.nonBrowserSinceRecovery).toBe(2);

        // Gate block should NOT reset the counter.
        handlePreTool("Bash", { command: "pnpm exec agent-browser eval document.title" }, tmp);
        expect(readState(tmp).browser.nonBrowserSinceRecovery).toBe(2);
    });

    it("does not increment totalCalls or pollute recentEvents on gate blocks", () => {
        // Trigger tier 1 recovery.
        for (let i = 0; i < BROWSER_DENSITY_MIN_CALLS; i++) {
            handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);
        }

        const stateAfterRecovery = readState(tmp);
        expect(stateAfterRecovery.browser.recoveryTier).toBe(1);
        const totalCallsAtRecovery = stateAfterRecovery.browser.totalCalls;

        // Gate-blocked browser calls should NOT increment totalCalls
        // or appear in recentEvents.
        handlePreTool("Bash", { command: "pnpm exec agent-browser eval document.title" }, tmp);
        handlePreTool("Bash", { command: "pnpm exec agent-browser snapshot -i -c" }, tmp);

        const stateAfterGateBlocks = readState(tmp);
        expect(stateAfterGateBlocks.browser.totalCalls).toBe(totalCallsAtRecovery);
        expect(stateAfterGateBlocks.recentEvents.filter(e => e.isBrowserCommand)).toHaveLength(0);
    });

    it("sets startedAt on first event", () => {
        expect(readState(tmp).startedAt).toBeNull();

        handlePreTool("Read", { file_path: "README.md" }, tmp);

        const state = readState(tmp);
        expect(state.startedAt).toBeTruthy();
        expect(new Date(state.startedAt).getTime()).toBeGreaterThan(0);
    });
});
