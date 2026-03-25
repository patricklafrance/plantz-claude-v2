/**
 * Parse a subagent transcript and append run metrics to .adlc/run-metrics.json.
 *
 * Extracts per-run token breakdown, per-tool use counts / tokens / duration,
 * and wall time from the JSONL transcript written by Claude Code.
 * Recomputes totals on each write.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * @param {string} transcriptPath  Absolute path to the agent's .jsonl transcript
 * @param {string} agentType       e.g. "_adlc-coder"
 * @param {string} cwd             Repo root (where .adlc/ lives)
 */
export function recordMetrics(transcriptPath, agentType, cwd) {
    if (!transcriptPath) {
        return;
    }

    const parsed = parseTranscript(transcriptPath);
    if (!parsed) {
        return;
    }

    const metricsPath = resolve(cwd, ".adlc", "run-metrics.json");

    let metrics;
    try {
        metrics = JSON.parse(readFileSync(metricsPath, "utf8"));
    } catch {
        metrics = { runs: [], totals: null };
    }

    metrics.runs.push({
        agent: agentType,
        tokens: {
            input: parsed.inputTokens,
            output: parsed.outputTokens,
            cacheRead: parsed.cacheReadTokens,
            cacheCreation: parsed.cacheCreationTokens,
            total: parsed.totalTokens
        },
        tools: parsed.tools,
        totalToolUses: parsed.totalToolUses,
        durationMs: parsed.durationMs,
        duration: formatDuration(parsed.durationMs),
        startedAt: parsed.firstTimestamp,
        completedAt: parsed.lastTimestamp
    });

    metrics.totals = computeTotals(metrics.runs);

    writeFileSync(metricsPath, JSON.stringify(metrics, null, 2) + "\n");
}

// ── Transcript parser ───────────────────────────────────────

function parseTranscript(transcriptPath) {
    let raw;
    try {
        raw = readFileSync(transcriptPath, "utf8");
    } catch {
        return null;
    }

    const lines = raw.trim().split("\n");

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheCreationTokens = 0;

    const toolCounts = {};
    const toolTokens = {};
    const toolDurations = {};

    // Map tool_use id → { name, timestamp } for duration matching
    const pendingTools = {};

    let firstTimestamp = null;
    let lastTimestamp = null;

    for (const line of lines) {
        let entry;
        try {
            entry = JSON.parse(line);
        } catch {
            continue;
        }

        // Track timestamps for wall time
        if (entry.timestamp) {
            if (!firstTimestamp) {
                firstTimestamp = entry.timestamp;
            }
            lastTimestamp = entry.timestamp;
        }

        const content = entry.message?.content;

        if (entry.type === "assistant") {
            const usage = entry.message?.usage;
            if (usage) {
                inputTokens += usage.input_tokens || 0;
                outputTokens += usage.output_tokens || 0;
                cacheReadTokens += usage.cache_read_input_tokens || 0;
                cacheCreationTokens += usage.cache_creation_input_tokens || 0;
            }

            // Count tool uses and attribute tokens proportionally
            if (Array.isArray(content)) {
                const toolUseBlocks = content.filter(b => b.type === "tool_use");

                if (toolUseBlocks.length > 0) {
                    const turnTokens = usage
                        ? (usage.input_tokens || 0) +
                          (usage.output_tokens || 0) +
                          (usage.cache_read_input_tokens || 0) +
                          (usage.cache_creation_input_tokens || 0)
                        : 0;
                    const perToolTokens = Math.round(turnTokens / toolUseBlocks.length);

                    for (const block of toolUseBlocks) {
                        const name = block.name || "unknown";
                        toolCounts[name] = (toolCounts[name] || 0) + 1;
                        toolTokens[name] = (toolTokens[name] || 0) + perToolTokens;

                        if (block.id && entry.timestamp) {
                            pendingTools[block.id] = { name, timestamp: entry.timestamp };
                        }
                    }
                }
            }
        }

        // Match tool results for duration tracking
        if (entry.type === "user" && Array.isArray(content) && entry.timestamp) {
            for (const block of content) {
                if (block.type === "tool_result" && block.tool_use_id) {
                    const pending = pendingTools[block.tool_use_id];
                    if (pending) {
                        const duration = new Date(entry.timestamp) - new Date(pending.timestamp);
                        if (duration >= 0) {
                            toolDurations[pending.name] = (toolDurations[pending.name] || 0) + duration;
                        }
                        delete pendingTools[block.tool_use_id];
                    }
                }
            }
        }
    }

    // Build tools map
    const tools = {};
    for (const name of Object.keys(toolCounts)) {
        tools[name] = {
            count: toolCounts[name],
            tokens: toolTokens[name] || 0,
            durationMs: toolDurations[name] || 0
        };
    }

    const totalTokens = inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens;
    const totalToolUses = Object.values(toolCounts).reduce((sum, c) => sum + c, 0);
    const durationMs = firstTimestamp && lastTimestamp ? new Date(lastTimestamp) - new Date(firstTimestamp) : 0;

    return {
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        totalTokens,
        tools,
        totalToolUses,
        durationMs,
        firstTimestamp,
        lastTimestamp
    };
}

// ── Totals ──────────────────────────────────────────────────

function computeTotals(runs) {
    const tokens = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, total: 0 };
    const tools = {};
    let totalToolUses = 0;
    let durationMs = 0;

    for (const run of runs) {
        tokens.input += run.tokens.input;
        tokens.output += run.tokens.output;
        tokens.cacheRead += run.tokens.cacheRead;
        tokens.cacheCreation += run.tokens.cacheCreation;
        tokens.total += run.tokens.total;

        for (const [name, data] of Object.entries(run.tools)) {
            if (!tools[name]) {
                tools[name] = { count: 0, tokens: 0, durationMs: 0 };
            }
            tools[name].count += data.count;
            tools[name].tokens += data.tokens;
            tools[name].durationMs += data.durationMs;
        }
        totalToolUses += run.totalToolUses;
        durationMs += run.durationMs;
    }

    return {
        tokens,
        tools,
        totalToolUses,
        durationMs,
        duration: formatDuration(durationMs)
    };
}

// ── Formatting ──────────────────────────────────────────────

function formatDuration(ms) {
    if (ms <= 0) {
        return "—";
    }
    const totalSec = Math.round(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}
