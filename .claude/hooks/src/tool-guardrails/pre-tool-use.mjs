#!/usr/bin/env node

/**
 * PreToolUse hook entry point for stateless tool guardrails.
 *
 * Exit 0 + no output         -> allow tool call
 * Exit 0 + JSON { decision } -> block tool call, feed reason back
 */

import { readFileSync } from "node:fs";

import { evaluate } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name ?? "Bash";
const toolInput = input.tool_input ?? {};

const result = evaluate(toolName, toolInput);

if (result.action === "block") {
    process.stdout.write(JSON.stringify({ decision: "block", reason: result.reason }));
}

process.exit(0);
