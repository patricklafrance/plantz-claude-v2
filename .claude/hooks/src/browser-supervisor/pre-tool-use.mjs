#!/usr/bin/env node

/**
 * PreToolUse — Browser supervisor entry point.
 *
 * Registered on Bash, Read, Write, and Edit. Delegates to the handler.
 *
 * Exit 0 + no output        → allow tool call
 * Exit 0 + JSON { decision } → block tool call, feed reason back
 */

import { readFileSync } from "node:fs";

import { evaluate } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name ?? "Bash";
const command = input.tool_input?.command ?? "";
const cwd = process.cwd();

const result = evaluate(toolName, command, cwd);

if (result.action === "block") {
    process.stdout.write(JSON.stringify({ decision: "block", reason: result.reason }));
}

process.exit(0);
