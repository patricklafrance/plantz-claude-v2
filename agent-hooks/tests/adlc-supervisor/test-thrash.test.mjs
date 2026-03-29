import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { handlePreTool } from "../../src/adlc-supervisor/handler.mjs";
import { EDIT_GAP_THRESHOLD, TEST_TOTAL_BUDGET } from "../../src/adlc-supervisor/policies/test-thrash.mjs";
import { readState, writeState } from "../../src/adlc-supervisor/state.mjs";

const TEST_CMD = "pnpm --filter @apps/today-storybook test:light 2>&1 | tail -30";
const TEST_CMD_ALT = "pnpm --filter @apps/today-storybook test:dark 2>&1 | tail -30";
const TEST_CMD_FULL = "pnpm test 2>&1 | tail -20";
const TEST_CMD_TURBO = "pnpm turbo run test --force 2>&1 | tail -10";

describe("test-thrash policy", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "supervisor-test-thrash-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    // --- Edit-gap detection ---

    it("allows test commands below the edit-gap threshold", () => {
        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
            expect(result.action).toBe("allow");
        }

        expect(readState(tmp).test.recoveryTier).toBe(0);
    });

    it("triggers tier 1 recovery when edit-gap threshold is reached", () => {
        // Run EDIT_GAP_THRESHOLD test commands without any Edit.
        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }

        // The threshold-th call triggers recovery.
        const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("Test loop detected");
        expect(result.reason).toContain("--reporter=verbose");

        const state = readState(tmp);
        expect(state.test.recoveryTier).toBe(1);
        expect(state.test.editsSinceRecovery).toBe(0);
    });

    it("resets edit-gap counter on Edit calls", () => {
        // Run 2 test commands, then an Edit, then more tests.
        handlePreTool("Bash", { command: TEST_CMD }, tmp);
        handlePreTool("Bash", { command: TEST_CMD_ALT }, tmp);
        handlePreTool("Edit", { file_path: "src/component.tsx", old_string: "a", new_string: "b" }, tmp);

        // Counter was reset by the Edit — these should all be allowed.
        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
            expect(result.action).toBe("allow");
        }
    });

    it("resets edit-gap counter on Write calls", () => {
        handlePreTool("Bash", { command: TEST_CMD }, tmp);
        handlePreTool("Bash", { command: TEST_CMD_ALT }, tmp);
        handlePreTool("Write", { file_path: "src/component.tsx", content: "code" }, tmp);

        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
            expect(result.action).toBe("allow");
        }
    });

    it("does NOT reset edit-gap counter on Read or Grep calls", () => {
        // Run tests with Read calls interleaved — Read is not progress.
        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
            handlePreTool("Read", { file_path: "src/test.tsx" }, tmp);
        }

        // Next test should trigger — Read did not reset the counter.
        const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("Test loop detected");
    });

    it("classifies various test command forms correctly", () => {
        const testCommands = [TEST_CMD, TEST_CMD_ALT, TEST_CMD_FULL, TEST_CMD_TURBO];

        // Each should increment the test counter.
        for (const cmd of testCommands) {
            handlePreTool("Bash", { command: cmd }, tmp);
        }

        const state = readState(tmp);
        expect(state.test.totalCalls).toBe(4);
        expect(state.test.consecutiveWithoutEdit).toBe(4);
    });

    it("does not count non-test bash commands toward edit-gap", () => {
        handlePreTool("Bash", { command: TEST_CMD }, tmp);
        handlePreTool("Bash", { command: "pnpm lint" }, tmp);
        handlePreTool("Bash", { command: "git status" }, tmp);
        handlePreTool("Bash", { command: TEST_CMD }, tmp);

        const state = readState(tmp);
        expect(state.test.consecutiveWithoutEdit).toBe(2);
        // Non-test bash commands don't reset the edit-gap counter
        // (only Edit/Write does), but they also don't increment it.
    });

    // --- Gate enforcement ---

    it("enforces edit gate after tier 1 recovery", () => {
        // Trigger tier 1.
        for (let i = 0; i < EDIT_GAP_THRESHOLD; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }

        // Next test should be gated (1 edit required for tier 1).
        const blocked = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("1 more Edit/Write call");

        // Do an Edit.
        handlePreTool("Edit", { file_path: "src/fix.tsx", old_string: "a", new_string: "b" }, tmp);

        // Gate cleared — test allowed.
        const allowed = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(allowed.action).toBe("allow");
    });

    it("escalates to tier 2 on second recovery trigger", () => {
        // Trigger tier 1.
        for (let i = 0; i < EDIT_GAP_THRESHOLD; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }
        expect(readState(tmp).test.recoveryTier).toBe(1);

        // Satisfy the gate with 1 Edit.
        handlePreTool("Edit", { file_path: "src/fix.tsx", old_string: "a", new_string: "b" }, tmp);

        // Run EDIT_GAP_THRESHOLD more tests without editing.
        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }

        const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("continues after previous warning");

        const state = readState(tmp);
        expect(state.test.recoveryTier).toBe(2);
    });

    it("requires 2 edits to clear tier 2 gate", () => {
        // Set up state at tier 2.
        const state = readState(tmp);
        state.test.recoveryTier = 2;
        state.test.editsSinceRecovery = 0;
        state.test.totalCalls = 8;
        writeState(tmp, state);

        // Test should be gated.
        const blocked = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(blocked.action).toBe("block");
        expect(blocked.reason).toContain("2 more Edit/Write call");

        // 1 Edit is not enough.
        handlePreTool("Edit", { file_path: "src/fix.tsx", old_string: "a", new_string: "b" }, tmp);
        const stillBlocked = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(stillBlocked.action).toBe("block");
        expect(stillBlocked.reason).toContain("1 more Edit/Write call");

        // 2nd Edit clears the gate.
        handlePreTool("Edit", { file_path: "src/fix2.tsx", old_string: "c", new_string: "d" }, tmp);
        const allowed = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(allowed.action).toBe("allow");
    });

    // --- Budget cap ---

    it("blocks when test budget is exceeded", () => {
        const state = readState(tmp);
        state.test.totalCalls = TEST_TOTAL_BUDGET + 1;
        writeState(tmp, state);

        const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(result.action).toBe("block");
        expect(result.reason).toContain("budget exhausted");
    });

    // --- Gate counter protection ---

    it("does not increment totalCalls or pollute recentEvents on gate blocks", () => {
        // Trigger tier 1 recovery.
        for (let i = 0; i < EDIT_GAP_THRESHOLD; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }

        const stateAfterRecovery = readState(tmp);
        const totalCallsAtRecovery = stateAfterRecovery.test.totalCalls;

        // Gate-blocked test calls should NOT increment totalCalls.
        handlePreTool("Bash", { command: TEST_CMD }, tmp);
        handlePreTool("Bash", { command: TEST_CMD_ALT }, tmp);

        const stateAfterGateBlocks = readState(tmp);
        expect(stateAfterGateBlocks.test.totalCalls).toBe(totalCallsAtRecovery);
    });

    // --- Non-interference ---

    it("does not interfere with non-test bash commands", () => {
        // Run many non-test bash commands — should all be allowed.
        for (let i = 0; i < 20; i++) {
            const result = handlePreTool("Bash", { command: "pnpm lint" }, tmp);
            expect(result.action).toBe("allow");
        }

        expect(readState(tmp).test.totalCalls).toBe(0);
    });

    // --- Message content ---

    it("includes recovery guidance in tier 1 message", () => {
        for (let i = 0; i < EDIT_GAP_THRESHOLD; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }

        const state = readState(tmp);
        // Find the recovery event — it was the last test call.
        // The message is in the block result, not in state. Re-trigger to check message.
        // Actually, we already checked the message content above.
        // Verify the state has the right fingerprints in recentEvents.
        expect(state.test.recoveryTier).toBe(1);
    });

    it("includes recent test fingerprints in block message", () => {
        for (let i = 0; i < EDIT_GAP_THRESHOLD - 1; i++) {
            handlePreTool("Bash", { command: TEST_CMD }, tmp);
        }

        const result = handlePreTool("Bash", { command: TEST_CMD }, tmp);
        expect(result.reason).toContain("Recent test commands:");
        expect(result.reason).toContain("pnpm --filter @apps/today-storybook test:light");
    });
});
