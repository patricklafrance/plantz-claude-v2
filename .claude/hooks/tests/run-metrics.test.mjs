import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { recordMetrics } from "../src/adlc-verification/run-metrics.mjs";

function makeTmpDir() {
    const dir = mkdtempSync(join(tmpdir(), "metrics-test-"));
    mkdirSync(join(dir, ".adlc"));
    return dir;
}

function makeTranscript(lines) {
    const tmp = mkdtempSync(join(tmpdir(), "transcript-"));
    const path = join(tmp, "agent.jsonl");
    writeFileSync(path, lines.map(l => JSON.stringify(l)).join("\n"));
    return { path, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

function readMetrics(cwd) {
    return JSON.parse(readFileSync(join(cwd, ".adlc", "run-metrics.json"), "utf8"));
}

describe("run-metrics", () => {
    let cwd;

    beforeEach(() => {
        cwd = makeTmpDir();
    });

    afterEach(() => {
        rmSync(cwd, { recursive: true, force: true });
    });

    it("should create run-metrics.json with per-tool breakdown and totals", () => {
        const transcript = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:00:00.000Z", message: { role: "user", content: "hello" } },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:00:05.000Z",
                message: {
                    content: [{ type: "tool_use", id: "t1", name: "Read", input: {} }],
                    usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 200, cache_creation_input_tokens: 80 }
                }
            },
            {
                type: "user",
                timestamp: "2026-03-25T10:00:06.000Z",
                message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "file contents" }] }
            },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:01:30.000Z",
                message: {
                    content: [
                        { type: "tool_use", id: "t2", name: "Edit", input: {} },
                        { type: "tool_use", id: "t3", name: "Read", input: {} }
                    ],
                    usage: { input_tokens: 120, output_tokens: 60, cache_read_input_tokens: 200, cache_creation_input_tokens: 0 }
                }
            },
            {
                type: "user",
                timestamp: "2026-03-25T10:01:32.000Z",
                message: {
                    content: [
                        { type: "tool_result", tool_use_id: "t2", content: "ok" },
                        { type: "tool_result", tool_use_id: "t3", content: "file contents" }
                    ]
                }
            },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:02:00.000Z",
                message: {
                    content: [{ type: "text", text: "done" }],
                    usage: { input_tokens: 80, output_tokens: 30, cache_read_input_tokens: 100, cache_creation_input_tokens: 0 }
                }
            }
        ]);

        recordMetrics(transcript.path, "_adlc-coder", cwd);
        transcript.cleanup();

        const metrics = readMetrics(cwd);

        expect(metrics.runs).toHaveLength(1);

        const run = metrics.runs[0];
        expect(run.agent).toBe("_adlc-coder");

        // Token totals: (100+50+200+80) + (120+60+200+0) + (80+30+100+0) = 1020
        expect(run.tokens.input).toBe(300);
        expect(run.tokens.output).toBe(140);
        expect(run.tokens.cacheRead).toBe(500);
        expect(run.tokens.cacheCreation).toBe(80);
        expect(run.tokens.total).toBe(1020);

        // Per-tool breakdown
        // Turn 1: 1 tool (Read), 430 tokens → Read gets 430
        // Turn 2: 2 tools (Edit, Read), 380 tokens → each gets 190
        expect(run.tools.Read).toEqual({ count: 2, tokens: 620, durationMs: 3000 });
        expect(run.tools.Edit).toEqual({ count: 1, tokens: 190, durationMs: 2000 });

        expect(run.totalToolUses).toBe(3);
        expect(run.duration).toBe("2m 0s");

        // Totals should match the single run
        expect(metrics.totals.tokens.total).toBe(1020);
        expect(metrics.totals.tools.Read).toEqual({ count: 2, tokens: 620, durationMs: 3000 });
        expect(metrics.totals.tools.Edit).toEqual({ count: 1, tokens: 190, durationMs: 2000 });
    });

    it("should append runs and aggregate totals across agents", () => {
        const t1 = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:00:00.000Z", message: {} },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:00:30.000Z",
                message: {
                    usage: { input_tokens: 50, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
                    content: [{ type: "tool_use", id: "t1", name: "Bash", input: {} }]
                }
            }
        ]);
        const t2 = makeTranscript([
            { type: "user", timestamp: "2026-03-25T11:00:00.000Z", message: {} },
            {
                type: "assistant",
                timestamp: "2026-03-25T11:05:00.000Z",
                message: {
                    usage: { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
                    content: [
                        { type: "tool_use", id: "t1", name: "Read", input: {} },
                        { type: "tool_use", id: "t2", name: "Bash", input: {} }
                    ]
                }
            }
        ]);

        recordMetrics(t1.path, "_adlc-planner", cwd);
        recordMetrics(t2.path, "_adlc-coder", cwd);
        t1.cleanup();
        t2.cleanup();

        const metrics = readMetrics(cwd);

        expect(metrics.runs).toHaveLength(2);
        expect(metrics.runs[0].agent).toBe("_adlc-planner");
        expect(metrics.runs[1].agent).toBe("_adlc-coder");

        // Totals aggregate across runs
        expect(metrics.totals.tokens.total).toBe(1570);
        expect(metrics.totals.tools.Bash.count).toBe(2);
        expect(metrics.totals.tools.Read.count).toBe(1);
        expect(metrics.totals.totalToolUses).toBe(3);
    });

    it("should preserve chronological order for resume tracking", () => {
        const coderRun1 = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:00:00.000Z", message: {} },
            { type: "assistant", timestamp: "2026-03-25T10:10:00.000Z", message: { usage: { input_tokens: 100, output_tokens: 50 }, content: [] } }
        ]);
        const reviewerRun = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:10:30.000Z", message: {} },
            { type: "assistant", timestamp: "2026-03-25T10:12:00.000Z", message: { usage: { input_tokens: 80, output_tokens: 40 }, content: [] } }
        ]);
        const coderRun2 = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:12:30.000Z", message: {} },
            { type: "assistant", timestamp: "2026-03-25T10:15:00.000Z", message: { usage: { input_tokens: 60, output_tokens: 30 }, content: [] } }
        ]);

        recordMetrics(coderRun1.path, "_adlc-coder", cwd);
        recordMetrics(reviewerRun.path, "_adlc-reviewer", cwd);
        recordMetrics(coderRun2.path, "_adlc-coder", cwd);
        coderRun1.cleanup();
        reviewerRun.cleanup();
        coderRun2.cleanup();

        const metrics = readMetrics(cwd);

        expect(metrics.runs.map(r => r.agent)).toEqual(["_adlc-coder", "_adlc-reviewer", "_adlc-coder"]);
        expect(metrics.totals.tokens.total).toBe(360);
    });

    it("should track tool duration from tool_result timestamps", () => {
        const transcript = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:00:00.000Z", message: {} },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:00:01.000Z",
                message: {
                    content: [{ type: "tool_use", id: "t1", name: "Bash", input: {} }],
                    usage: { input_tokens: 100, output_tokens: 50 }
                }
            },
            {
                type: "user",
                timestamp: "2026-03-25T10:00:11.000Z",
                message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "test output" }] }
            },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:00:15.000Z",
                message: {
                    content: [{ type: "tool_use", id: "t2", name: "Bash", input: {} }],
                    usage: { input_tokens: 120, output_tokens: 60 }
                }
            },
            {
                type: "user",
                timestamp: "2026-03-25T10:00:20.000Z",
                message: { content: [{ type: "tool_result", tool_use_id: "t2", content: "lint output" }] }
            }
        ]);

        recordMetrics(transcript.path, "_adlc-coder", cwd);
        transcript.cleanup();

        const run = readMetrics(cwd).runs[0];

        // Bash: t1 took 10s, t2 took 5s → 15s total
        expect(run.tools.Bash.count).toBe(2);
        expect(run.tools.Bash.durationMs).toBe(15000);
    });

    it("should handle missing transcript gracefully", () => {
        recordMetrics("/nonexistent/path.jsonl", "_adlc-coder", cwd);
        expect(() => readFileSync(join(cwd, ".adlc", "run-metrics.json"))).toThrow();
    });

    it("should handle null transcript path", () => {
        recordMetrics(null, "_adlc-coder", cwd);
        expect(() => readFileSync(join(cwd, ".adlc", "run-metrics.json"))).toThrow();
    });
});
