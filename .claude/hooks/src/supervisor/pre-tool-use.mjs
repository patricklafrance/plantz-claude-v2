#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { handlePreTool } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));

// The supervisor targets autonomous ADLC agents that run without user oversight.
// Interactive Claude Code sessions are supervised by the user; skipping here avoids
// false positives from stale cross-session state and prevents state from accumulating
// in .adlc/ with no SubagentStop cleanup path.
const agentName = input.agent_type ?? input.agent_name ?? null;
if (!agentName?.startsWith("_adlc-")) {
    process.exit(0);
}

const toolName = input.tool_name ?? "Bash";
const toolInput = input.tool_input ?? {};
const cwd = input.cwd ?? process.cwd();

const result = handlePreTool(toolName, toolInput, cwd, input);

if (result.action === "block") {
    process.stdout.write(JSON.stringify({ decision: "block", reason: result.reason }));
}

process.exit(0);
