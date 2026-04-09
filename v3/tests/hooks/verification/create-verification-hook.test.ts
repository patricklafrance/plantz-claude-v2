import { describe, expect, it, vi } from "vitest";

import type { SubagentStopHookInput } from "../../../src/hooks/types.js";
import { createVerificationHook } from "../../../src/hooks/verification/create-verification-hook.js";

// Mock metrics — avoid filesystem side effects
vi.mock("../../../src/hooks/verification/metrics.js", () => ({
    recordMetrics: vi.fn(),
    archiveArtifacts: vi.fn()
}));

// Mock all 9 handlers
vi.mock("../../../src/hooks/verification/coder/handler.js", () => ({
    handleCoder: vi.fn(async () => [])
}));
vi.mock("../../../src/hooks/verification/document/handler.js", () => ({
    handleDocument: vi.fn(async () => [])
}));
vi.mock("../../../src/hooks/verification/domain-mapper/handler.js", () => ({
    handleModuleMapper: vi.fn(async () => [])
}));
vi.mock("../../../src/hooks/verification/evidence-researcher/handler.js", () => ({
    handleEvidenceResearcher: vi.fn(() => [])
}));
vi.mock("../../../src/hooks/verification/placement-gate/handler.js", () => ({
    handlePlacementGate: vi.fn(() => [])
}));
vi.mock("../../../src/hooks/verification/plan-gate/handler.js", () => ({
    handlePlanGate: vi.fn(() => [])
}));
vi.mock("../../../src/hooks/verification/planner/handler.js", () => ({
    handlePlanner: vi.fn(() => [])
}));
vi.mock("../../../src/hooks/verification/reviewer/handler.js", () => ({
    handleReviewer: vi.fn(() => [])
}));
vi.mock("../../../src/hooks/verification/simplify/handler.js", () => ({
    handleSimplify: vi.fn(async () => [])
}));

// Import the mocked modules so we can control their return values
import { handleCoder } from "../../../src/hooks/verification/coder/handler.js";
import { handlePlanner } from "../../../src/hooks/verification/planner/handler.js";
import { handleReviewer } from "../../../src/hooks/verification/reviewer/handler.js";

function makeStopInput(overrides: Partial<SubagentStopHookInput> = {}): SubagentStopHookInput {
    return {
        hook_event_name: "SubagentStop",
        session_id: "test-session",
        transcript_path: "/tmp/transcript.json",
        cwd: "/tmp/test-project",
        agent_id: "agent-1",
        agent_type: "coder",
        agent_transcript_path: "/tmp/agent-transcript.json",
        stop_hook_active: false,
        ...overrides
    };
}

describe("createVerificationHook", () => {
    it("routes coder to coder handler", async () => {
        const hook = createVerificationHook();
        const result = await hook(makeStopInput({ agent_type: "coder" }));

        expect(handleCoder).toHaveBeenCalledWith("/tmp/test-project");
        expect(result).toEqual({ continue: true });
    });

    it("routes planner to planner handler", async () => {
        const hook = createVerificationHook();
        await hook(makeStopInput({ agent_type: "planner" }));

        expect(handlePlanner).toHaveBeenCalledWith("/tmp/test-project");
    });

    it("passes through unknown agent types", async () => {
        const hook = createVerificationHook();
        const result = await hook(makeStopInput({ agent_type: "unknown" }));

        expect(result).toEqual({ continue: true });
    });

    it("passes through non-ADLC agent types", async () => {
        const hook = createVerificationHook();
        const result = await hook(makeStopInput({ agent_type: "some-other-agent" }));

        expect(result).toEqual({ continue: true });
    });

    it("skips verification when stop_hook_active is true", async () => {
        const hook = createVerificationHook();
        const result = await hook(makeStopInput({ stop_hook_active: true }));

        // Should pass through without calling any handler
        expect(result).toEqual({ continue: true });
    });

    it("blocks when handler reports problems", async () => {
        vi.mocked(handleCoder).mockResolvedValueOnce(["Build failed: type error in src/foo.ts", "Lint: 3 errors found"]);

        const hook = createVerificationHook();
        const result = await hook(makeStopInput({ agent_type: "coder" }));

        expect(result.decision).toBe("block");
        expect(result.reason).toContain("coder post-completion checks failed");
        expect(result.reason).toContain("Build failed");
        expect(result.reason).toContain("Lint: 3 errors found");
    });

    it("allows when handler returns empty problems", async () => {
        vi.mocked(handleReviewer).mockReturnValueOnce([]);

        const hook = createVerificationHook();
        const result = await hook(makeStopInput({ agent_type: "reviewer" }));

        expect(result).toEqual({ continue: true });
    });
});
