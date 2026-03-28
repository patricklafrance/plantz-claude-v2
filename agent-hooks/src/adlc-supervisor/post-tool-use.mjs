#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { handlePostTool } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));

const agentName = input.agent_type ?? input.agent_name ?? null;
if (!agentName?.startsWith("_adlc-")) {
    process.exit(0);
}

const toolName = input.tool_name ?? "Bash";
const toolInput = input.tool_input ?? {};
const cwd = input.cwd ?? process.cwd();

handlePostTool(toolName, toolInput, cwd, input);

process.exit(0);
