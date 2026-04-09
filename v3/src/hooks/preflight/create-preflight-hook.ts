/**
 * Preflight hook — stateless tool guardrails run before every tool call.
 *
 * Two concerns:
 * 1. Rewrites: normalizes bare `agent-browser` to `pnpm exec agent-browser` (Bash only).
 * 2. Guards: blocks bad patterns (wrong package manager, cmd.exe, bare typecheck,
 *    reading node_modules source). Guards run on the rewritten command so both
 *    concerns see the same input.
 *
 * If a guard blocks, the rewrite is irrelevant (the call never executes).
 * If no guard blocks but a rewrite occurred, the rewritten command is sent
 * back to the SDK via updatedInput.
 */

import type { HookJSONOutput, PreToolUseHookInput } from "../types.js";
import { rewriteBareAgent } from "./agent-browser-rewrite.js";
import checkBlockBareTypecheck from "./block-bare-typecheck.js";
import checkBlockNodeModulesRead from "./block-node-modules-read.js";
import checkBlockNpm from "./block-npm.js";
import checkBlockWindowsCmd from "./block-windows-cmd.js";

const guards = [checkBlockNpm, checkBlockWindowsCmd, checkBlockBareTypecheck, checkBlockNodeModulesRead];

export function createPreflightHook() {
    return async (input: PreToolUseHookInput): Promise<HookJSONOutput> => {
        const toolName = input.tool_name;
        const toolInput = { ...((input.tool_input ?? {}) as Record<string, unknown>) };

        // Rewrite bare agent-browser invocations (Bash only).
        let rewritten: string | null = null;
        if (toolName === "Bash") {
            const browserRewritten = rewriteBareAgent(toolInput.command as string | undefined);
            if (browserRewritten) {
                toolInput.command = browserRewritten;
                rewritten = browserRewritten;
            }
        }

        // Run guards on the (possibly rewritten) input.
        for (const guard of guards) {
            const result = guard(toolName, toolInput);
            if (result) {
                return {
                    decision: "block",
                    reason: result.reason,
                    hookSpecificOutput: {
                        hookEventName: "PreToolUse",
                        permissionDecision: "deny",
                        permissionDecisionReason: result.reason
                    }
                };
            }
        }

        // No block — if a rewrite occurred, tell the SDK to use the updated input.
        if (rewritten) {
            return {
                continue: true,
                hookSpecificOutput: {
                    hookEventName: "PreToolUse",
                    updatedInput: { command: rewritten }
                }
            };
        }

        return { continue: true };
    };
}
