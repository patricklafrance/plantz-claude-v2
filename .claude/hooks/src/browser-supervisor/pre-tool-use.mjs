#!/usr/bin/env node

/**
 * PreToolUse — Browser supervisor entry point.
 *
 * Registered on Bash, Read, Write, and Edit. Delegates to the handler.
 *
 * Exit 0 + no output        → allow tool call
 * Exit 0 + JSON { decision } → block tool call, feed reason back
 * Exit 0 + JSON { hookSpecificOutput } → rewrite the command
 */

import { readFileSync } from "node:fs";

import { rewriteBareAgent } from "./bare-rewrite.mjs";
import { evaluate } from "./handler.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name ?? "Bash";
const command = input.tool_input?.command ?? "";
const cwd = process.cwd();

// Rewrite bare agent-browser invocations to pnpm exec agent-browser.
const rewritten = toolName === "Bash" ? rewriteBareAgent(command) : null;
const effectiveCommand = rewritten ?? command;

const result = evaluate(toolName, effectiveCommand, cwd);

if (result.action === "block") {
    process.stdout.write(JSON.stringify({ decision: "block", reason: result.reason }));
} else if (rewritten) {
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            updatedInput: { command: rewritten }
        }
    }));
}

process.exit(0);
