#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { recordToolResult } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name ?? "Bash";
const toolInput = input.tool_input ?? {};
const cwd = input.cwd ?? process.cwd();

recordToolResult(toolName, toolInput, cwd, input);

process.exit(0);
