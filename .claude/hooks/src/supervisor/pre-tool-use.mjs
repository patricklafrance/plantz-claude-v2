#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { evaluate } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name ?? "Bash";
const toolInput = input.tool_input ?? {};
const cwd = input.cwd ?? process.cwd();

const result = evaluate(toolName, toolInput, cwd, input);

if (result.action === "block") {
    process.stdout.write(JSON.stringify({ decision: "block", reason: result.reason }));
}

process.exit(0);
