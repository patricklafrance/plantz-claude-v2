import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { recordMetrics } from "../src/adlc-verification/run-metrics.mjs";

function makeTmpDir() {
    const dir = mkdtempSync(join(tmpdir(), "metrics-test-"));
    // Create .adlc/ directory
    const adlc = join(dir, ".adlc");
    require("node:fs").mkdirSync(adlc);
    return dir;
}

function makeTranscript(lines) {
    const tmp = mkdtempSync(join(tmpdir(), "transcript-"));
    const path = join(tmp, "agent.jsonl");
    writeFileSync(path, lines.map(l => JSON.stringify(l)).join("\n"));
    return { path, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

describe("run-metrics", () => {
    let cwd;

    beforeEach(() => {
        cwd = makeTmpDir();
    });

    afterEach(() => {
        rmSync(cwd, { recursive: true, force: true });
    });

    it("should create run-metrics.md with header and one row", () => {
        const transcript = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:00:00.000Z", message: { role: "user", content: "hello" } },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:01:30.000Z",
                message: {
                    role: "assistant",
                    content: [{ type: "tool_use", id: "t1", name: "Read", input: {} }],
                    usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 200, cache_creation_input_tokens: 80 }
                }
            },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:02:00.000Z",
                message: {
                    role: "assistant",
                    content: [{ type: "text", text: "done" }],
                    usage: { input_tokens: 120, output_tokens: 60, cache_read_input_tokens: 200, cache_creation_input_tokens: 0 }
                }
            }
        ]);

        recordMetrics(transcript.path, "_adlc-coder", cwd);
        transcript.cleanup();

        const content = readFileSync(join(cwd, ".adlc", "run-metrics.md"), "utf8");
        expect(content).toContain("# Run Metrics");
        expect(content).toContain("| _adlc-coder |");
        expect(content).toContain("| 810 |"); // 100+50+200+80+120+60+200+0
        expect(content).toContain("| 1 |"); // one tool_use block
        expect(content).toContain("2m 0s");
    });

    it("should append rows to existing file", () => {
        const t1 = makeTranscript([
            { type: "user", timestamp: "2026-03-25T10:00:00.000Z", message: {} },
            {
                type: "assistant",
                timestamp: "2026-03-25T10:00:30.000Z",
                message: { usage: { input_tokens: 50, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }, content: [] }
            }
        ]);
        const t2 = makeTranscript([
            { type: "user", timestamp: "2026-03-25T11:00:00.000Z", message: {} },
            {
                type: "assistant",
                timestamp: "2026-03-25T11:05:00.000Z",
                message: {
                    usage: { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
                    content: [{ type: "tool_use", id: "t1", name: "Read", input: {} }]
                }
            }
        ]);

        recordMetrics(t1.path, "_adlc-planner", cwd);
        recordMetrics(t2.path, "_adlc-coder", cwd);
        t1.cleanup();
        t2.cleanup();

        const content = readFileSync(join(cwd, ".adlc", "run-metrics.md"), "utf8");
        const lines = content.trim().split("\n");
        // header (1) + blank (1 in table) + separator (1) + 2 data rows = at least 5 or 6
        expect(lines.filter(l => l.startsWith("| _adlc-"))).toHaveLength(2);
    });

    it("should handle missing transcript gracefully", () => {
        recordMetrics("/nonexistent/path.jsonl", "_adlc-coder", cwd);

        // No file should be created
        expect(() => readFileSync(join(cwd, ".adlc", "run-metrics.md"))).toThrow();
    });

    it("should handle null transcript path", () => {
        recordMetrics(null, "_adlc-coder", cwd);
        expect(() => readFileSync(join(cwd, ".adlc", "run-metrics.md"))).toThrow();
    });
});
