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

    const slice = detectSlice(cwd);
    const mode = detectMode(agentType, slice, metrics.runs);

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
                slice,
                mode,
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
        slice,
        mode,
        tokens: {
            input: parsed.inputTokens,
            output: parsed.outputTokens,
            cacheRead: parsed.cacheReadTokens,
            cacheCreation: parsed.cacheCreationTokens,
            conversationTokens: parsed.conversationTokens,
            billableTokens: parsed.billableTokens
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

// ── Slice & mode detection ─────────────────────────────────

/** Read .adlc/current-slice.md frontmatter to get the active slice ID. */
function detectSlice(cwd) {
    const slicePath = resolve(cwd, ".adlc", "current-slice.md");
    try {
        const content = readFileSync(slicePath, "utf8");
        const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!fmMatch) return null;
        const idMatch = fmMatch[1].match(/^id:\s*(.+)$/m);
        return idMatch ? idMatch[1].trim() : null;
    } catch {
        return null;
    }
}

/**
 * Infer mode from prior runs. Agents that support draft/revision modes
 * (_adlc-coder, _adlc-planner, _adlc-domain-mapper) are "draft" on their
 * first run for a given slice (or globally for planners/mappers) and
 * "revision" on subsequent runs.
 */
function detectMode(agentType, sliceId, existingRuns) {
    const modedAgents = ["_adlc-coder", "_adlc-planner", "_adlc-domain-mapper"];
    if (!modedAgents.includes(agentType)) {
        return null;
    }

    const priorRuns = existingRuns.filter(r => r.agent === agentType && r.slice === sliceId);

    return priorRuns.length === 0 ? "draft" : "revision";
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
    let lastTurnInputSide = 0;
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

                // Overwrite on each assistant turn — final value is the conversation size
                lastTurnInputSide = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
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
                        const perCacheRead = Math.round(turnCacheRead / n);
                        const perCacheCreation = Math.round(turnCacheCreation / n);
                        const callRecord = {
                            id: block.id || null,
                            name,
                            input: block.input || {},
                            dispatchedAt: entry.timestamp || null,
                            completedAt: null,
                            durationMs: 0,
                            tokens: perToolTokens,
                            cacheReadTokens: perCacheRead,
                            cacheCreationTokens: perCacheCreation,
                            billableTokens: computeBillable(Math.round(turnInput / n), Math.round(turnOutput / n), perCacheRead, perCacheCreation),
                            conversationTokens: lastTurnInputSide
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

    const billableTokens = computeBillable(inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens);
    const totalToolUses = Object.values(toolCounts).reduce((sum, c) => sum + c, 0);
    const durationMs = firstTimestamp && lastTimestamp ? new Date(lastTimestamp) - new Date(firstTimestamp) : 0;

    return {
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        conversationTokens: lastTurnInputSide,
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
    const tokens = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, billableTokens: 0 };
    const tools = {};
    let totalToolUses = 0;
    let durationMs = 0;

    for (const run of runs) {
        tokens.input += run.tokens.input;
        tokens.output += run.tokens.output;
        tokens.cacheRead += run.tokens.cacheRead;
        tokens.cacheCreation += run.tokens.cacheCreation;
        tokens.billableTokens += run.tokens.billableTokens;

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
        duration: formatDuration(durationMs),
        rework: computeRework(runs)
    };
}

function computeRework(runs) {
    const revisionRuns = runs.filter(r => r.mode === "revision");
    if (revisionRuns.length === 0) {
        return { cycles: 0, slices: [], durationMs: 0, billableTokens: 0 };
    }

    // A rework cycle = the revision coder + the reviewer that follows it for the same slice.
    // Collect all runs (any agent type) tagged as revision, plus the reviewer that
    // immediately follows each revision coder for the same slice.
    const reworkSlices = [...new Set(revisionRuns.map(r => r.slice).filter(Boolean))];

    let reworkDuration = 0;
    let reworkTokens = 0;
    for (let i = 0; i < runs.length; i++) {
        const run = runs[i];
        if (run.mode !== "revision") continue;
        reworkDuration += run.durationMs;
        reworkTokens += run.tokens.billableTokens;

        // Include the re-review that follows this revision coder
        const next = runs[i + 1];
        if (next && next.agent === "_adlc-reviewer" && next.slice === run.slice) {
            reworkDuration += next.durationMs;
            reworkTokens += next.tokens.billableTokens;
        }
    }

    return {
        cycles: revisionRuns.length,
        slices: reworkSlices,
        durationMs: reworkDuration,
        billableTokens: reworkTokens
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
