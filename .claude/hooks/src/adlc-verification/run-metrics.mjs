/**
 * Parse a subagent transcript and append run metrics to .adlc/run-metrics.json.
 *
 * Extracts per-run token breakdown, per-tool use counts / tokens / duration,
 * individual tool call details, model info, and wall time from the JSONL
 * transcript written by Claude Code. Recomputes totals on each write.
 *
 * Per-run detail files are written to .adlc/run-details/ and linked from
 * the main metrics file.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

    // Write detail file
    const runIndex = metrics.runs.length + 1;
    const detailsFile = `run-details/${String(runIndex).padStart(3, "0")}-${agentType}.json`;
    const detailsPath = resolve(cwd, ".adlc", detailsFile);

    const detailsDir = resolve(cwd, ".adlc", "run-details");
    if (!existsSync(detailsDir)) {
        mkdirSync(detailsDir, { recursive: true });
    }

    writeFileSync(
        detailsPath,
        JSON.stringify(
            {
                agent: agentType,
                model: parsed.model,
                calls: parsed.toolCalls
            },
            null,
            2
        ) + "\n"
    );

    // Append run entry
    metrics.runs.push({
        agent: agentType,
        model: parsed.model,
        tokens: {
            input: parsed.inputTokens,
            output: parsed.outputTokens,
            cacheRead: parsed.cacheReadTokens,
            cacheCreation: parsed.cacheCreationTokens,
            contextTokens: parsed.contextTokens,
            billable: parsed.billableTokens
        },
        tools: parsed.tools,
        totalToolUses: parsed.totalToolUses,
        detailsFile,
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

    // Individual tool call records for the detail file
    const toolCalls = [];
    // Map tool_use id → index in toolCalls for completion matching
    const pendingById = {};

    let model = null;
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
            // Extract model from first assistant message
            if (!model && entry.message?.model) {
                model = entry.message.model;
            }

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
                    const turnInput = usage?.input_tokens || 0;
                    const turnOutput = usage?.output_tokens || 0;
                    const turnCacheRead = usage?.cache_read_input_tokens || 0;
                    const turnCacheCreation = usage?.cache_creation_input_tokens || 0;
                    const turnTotal = turnInput + turnOutput + turnCacheRead + turnCacheCreation;
                    const n = toolUseBlocks.length;

                    for (const block of toolUseBlocks) {
                        const name = block.name || "unknown";
                        const perToolTokens = Math.round(turnTotal / n);

                        // Aggregate stats
                        toolCounts[name] = (toolCounts[name] || 0) + 1;
                        toolTokens[name] = (toolTokens[name] || 0) + perToolTokens;

                        // Individual call record
                        const callRecord = {
                            id: block.id || null,
                            name,
                            input: block.input || {},
                            dispatchedAt: entry.timestamp || null,
                            completedAt: null,
                            durationMs: 0,
                            tokens: perToolTokens,
                            cacheReadTokens: Math.round(turnCacheRead / n),
                            cacheCreationTokens: Math.round(turnCacheCreation / n)
                        };
                        toolCalls.push(callRecord);

                        if (block.id && entry.timestamp) {
                            pendingById[block.id] = toolCalls.length - 1;
                        }
                    }
                }
            }
        }

        // Match tool results for duration tracking
        if (entry.type === "user" && Array.isArray(content) && entry.timestamp) {
            for (const block of content) {
                if (block.type === "tool_result" && block.tool_use_id) {
                    const idx = pendingById[block.tool_use_id];
                    if (idx !== undefined) {
                        const call = toolCalls[idx];
                        const duration = new Date(entry.timestamp) - new Date(call.dispatchedAt);
                        if (duration >= 0) {
                            call.completedAt = entry.timestamp;
                            call.durationMs = duration;
                            const name = call.name;
                            toolDurations[name] = (toolDurations[name] || 0) + duration;
                        }
                        delete pendingById[block.tool_use_id];
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

    const contextTokens = inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens;
    const billableTokens = computeBillable(inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens);
    const totalToolUses = Object.values(toolCounts).reduce((sum, c) => sum + c, 0);
    const durationMs = firstTimestamp && lastTimestamp ? new Date(lastTimestamp) - new Date(firstTimestamp) : 0;

    return {
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        contextTokens,
        billableTokens,
        tools,
        toolCalls,
        totalToolUses,
        model,
        durationMs,
        firstTimestamp,
        lastTimestamp
    };
}

// ── Totals ──────────────────────────────────────────────────

function computeTotals(runs) {
    const tokens = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, contextTokens: 0, billable: 0 };
    const tools = {};
    let totalToolUses = 0;
    let durationMs = 0;

    for (const run of runs) {
        tokens.input += run.tokens.input;
        tokens.output += run.tokens.output;
        tokens.cacheRead += run.tokens.cacheRead;
        tokens.cacheCreation += run.tokens.cacheCreation;
        tokens.contextTokens += run.tokens.contextTokens;
        tokens.billable += run.tokens.billable;

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

// ── Billing ─────────────────────────────────────────────────

// Weighted cost in input-token equivalents. Ratios are consistent across
// Claude model tiers: cache read = 0.1×, cache creation = 1.25×, output = 5×.
function computeBillable(input, output, cacheRead, cacheCreation) {
    return Math.round(input + output * 5 + cacheRead * 0.1 + cacheCreation * 1.25);
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
