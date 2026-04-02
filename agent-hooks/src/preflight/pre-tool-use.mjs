#!/usr/bin/env node

/**
 * PreToolUse hook entry point for stateless tool guardrails.
 *
 * Exit 0 + no output         -> allow tool call
 * Exit 0 + JSON { decision } -> block tool call, feed reason back
 */

import { readFileSync } from "node:fs";

import { rewriteBareAgent } from "./agent-browser-rewrite.mjs";
import { evaluate } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name ?? "Bash";
const toolInput = { ...input.tool_input };

let rewritten = null;
if (toolName === "Bash") {
    const browserRewritten = rewriteBareAgent(toolInput.command ?? "");
    if (browserRewritten) {
        toolInput.command = browserRewritten;
        rewritten = browserRewritten;
    }
}

const result = evaluate(toolName, toolInput);

if (result.action === "block") {
    process.stdout.write(JSON.stringify({ decision: "block", reason: result.reason }));
} else if (rewritten) {
    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: "PreToolUse",
                updatedInput: { command: rewritten }
            }
        })
    );
}

process.exit(0);
