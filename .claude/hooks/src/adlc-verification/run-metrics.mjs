/**
 * Parse a subagent transcript and append run metrics to .adlc/run-metrics.md.
 *
 * Extracts total tokens (input + cache + output), tool use count, and wall
 * time from the JSONL transcript written by Claude Code.
 */

import { appendFileSync, readFileSync } from "node:fs";
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

    let raw;
    try {
        raw = readFileSync(transcriptPath, "utf8");
    } catch {
        return; // transcript missing or unreadable — skip silently
    }

    const lines = raw.trim().split("\n");

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheCreationTokens = 0;
    let toolUses = 0;
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

        if (entry.type !== "assistant") {
            continue;
        }

        const usage = entry.message?.usage;
        if (usage) {
            inputTokens += usage.input_tokens || 0;
            outputTokens += usage.output_tokens || 0;
            cacheReadTokens += usage.cache_read_input_tokens || 0;
            cacheCreationTokens += usage.cache_creation_input_tokens || 0;
        }

        // Count tool uses in this turn
        const content = entry.message?.content;
        if (Array.isArray(content)) {
            for (const block of content) {
                if (block.type === "tool_use") {
                    toolUses++;
                }
            }
        }
    }

    const totalTokens = inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens;
    const durationMs = firstTimestamp && lastTimestamp ? new Date(lastTimestamp) - new Date(firstTimestamp) : 0;

    const duration = formatDuration(durationMs);
    const tokens = formatTokens(totalTokens);

    const metricsLine = `| ${agentType} | ${tokens} | ${toolUses} | ${duration} |\n`;

    const metricsPath = resolve(cwd, ".adlc", "run-metrics.md");

    try {
        readFileSync(metricsPath, "utf8");
    } catch {
        // File doesn't exist — write the header first
        appendFileSync(metricsPath, "# Run Metrics\n\n| Agent | Tokens | Tool uses | Duration |\n| ----- | ------ | --------- | -------- |\n");
    }

    appendFileSync(metricsPath, metricsLine);
}

function formatDuration(ms) {
    if (ms <= 0) {
        return "—";
    }
    const totalSec = Math.round(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function formatTokens(n) {
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(1)}M`;
    }
    if (n >= 1_000) {
        return `${(n / 1_000).toFixed(1)}k`;
    }
    return String(n);
}
