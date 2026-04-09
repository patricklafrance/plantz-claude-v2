import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock SDK ────────────────────────────────────────────────────────────────

type MockMessage = { type: "result"; subtype: "success"; result: string; session_id: string };

let queryCallLog: { prompt: string; options: Record<string, unknown> }[] = [];
let agentResultMap: Record<string, string> = {};

function createMockConversation(result: string): AsyncGenerator<MockMessage, void> {
    return (async function* () {
        yield {
            type: "result" as const,
            subtype: "success" as const,
            result,
            session_id: "mock-session-id"
        };
    })();
}

vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
    query: vi.fn((params: { prompt: string; options?: Record<string, unknown> }) => {
        queryCallLog.push({ prompt: params.prompt, options: params.options ?? {} });
        const agentName = (params.options?.agent as string) ?? "unknown";
        const result = agentResultMap[agentName] ?? "";
        return createMockConversation(result);
    })
}));

// ── Import under test ───────────────────────────────────────────────────────

import { runPlacement } from "../../../src/workflow/steps/placement.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function agentCallOrder(): string[] {
    return queryCallLog.map(call => call.options.agent as string);
}

const mockAgents = {
    "domain-mapper": { description: "mock", prompt: "mock" },
    "placement-gate": { description: "mock", prompt: "mock" },
    "evidence-researcher": { description: "mock", prompt: "mock" }
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("runPlacement", () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = mkdtempSync(join(tmpdir(), "placement-test-"));
        queryCallLog = [];
        agentResultMap = {};
    });

    afterEach(() => {
        rmSync(tmpDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it("calls domain-mapper then placement-gate when everything passes", async () => {
        agentResultMap["placement-gate"] = "All placements look correct.";

        await runPlacement("Add plant watering feature", tmpDir, mockAgents);

        const order = agentCallOrder();
        expect(order).toEqual(["domain-mapper", "placement-gate"]);
    });

    it("runs evidence-researcher when placement-gate finds issues", async () => {
        let placementCallCount = 0;
        const { query: mockQuery } = await import("@anthropic-ai/claude-agent-sdk");
        vi.mocked(mockQuery).mockImplementation((params: { prompt: string; options?: Record<string, unknown> }) => {
            queryCallLog.push({ prompt: params.prompt, options: params.options ?? {} });
            const agentName = (params.options?.agent as string) ?? "unknown";

            if (agentName === "placement-gate") {
                placementCallCount++;
                const result = placementCallCount === 1 ? "Found issue: unclear module boundary." : "All placements verified.";
                return createMockConversation(result);
            }
            return createMockConversation("");
        });

        await runPlacement("Add plant list", tmpDir, mockAgents);

        const order = agentCallOrder();
        expect(order[0]).toBe("domain-mapper");
        expect(order[1]).toBe("placement-gate");
        expect(order[2]).toBe("evidence-researcher");
        expect(order[3]).toBe("domain-mapper");
        expect(order[4]).toBe("placement-gate");
    });

    it("respects max domain mapping attempts", async () => {
        agentResultMap["placement-gate"] = "Found issue: still broken.";

        await runPlacement("Feature", tmpDir, mockAgents);

        const order = agentCallOrder();
        const domainMapperCalls = order.filter(a => a === "domain-mapper");
        const evidenceResearcherCalls = order.filter(a => a === "evidence-researcher");

        expect(domainMapperCalls).toHaveLength(3);
        expect(evidenceResearcherCalls).toHaveLength(3);
    });

    it("creates .adlc directory structure", async () => {
        agentResultMap["placement-gate"] = "Fine.";

        await runPlacement("Feature", tmpDir, mockAgents);

        const { existsSync } = await import("node:fs");
        const { resolve } = await import("node:path");
        expect(existsSync(resolve(tmpDir, ".adlc/slices"))).toBe(true);
        expect(existsSync(resolve(tmpDir, ".adlc/implementation-notes"))).toBe(true);
        expect(existsSync(resolve(tmpDir, ".adlc/verification-results"))).toBe(true);
    });

    it("passes feature description to domain mapper", async () => {
        agentResultMap["placement-gate"] = "Fine.";

        await runPlacement("Add plant watering schedule", tmpDir, mockAgents);

        const domainMapperCall = queryCallLog.find(c => (c.options.agent as string) === "domain-mapper");
        expect(domainMapperCall?.prompt).toContain("Add plant watering schedule");
    });
});
