/** Hook assembly — creates the SDK hooks configuration object. */

import { createPreCommitHook } from "./pre-commit/create-pre-commit-hook.js";
import { createGuardsHook } from "./guards/create-guards-hook.js";
import { createRewritesHook } from "./rewrites/create-rewrites-hook.js";
import { createSupervisorHooks } from "./supervisor/create-supervisor-hooks.js";
import type { HookJSONOutput, PostToolUseHookInput, PreToolUseHookInput, SubagentStopHookInput } from "./types.js";
import { createPostAgentChecksHook } from "./post-agent-checks/create-post-agent-checks-hook.js";

// ── SDK callback types (kept local to avoid SDK dependency at type level) ──

type HookInput = PreToolUseHookInput | PostToolUseHookInput | SubagentStopHookInput;
type HookCallback = (input: HookInput, toolUseID: string | undefined, options: { signal: AbortSignal }) => Promise<HookJSONOutput>;

interface HookCallbackMatcher {
    matcher?: string;
    hooks: HookCallback[];
    timeout?: number;
}

type SDKHooks = Partial<Record<string, HookCallbackMatcher[]>>;

// ── Adapter: wrap our typed callbacks into the generic SDK callback shape ──

function wrapPreToolHook(fn: (input: PreToolUseHookInput) => Promise<HookJSONOutput>): HookCallback {
    return (input, _toolUseID, _options) => fn(input as PreToolUseHookInput);
}

function wrapPostToolHook(fn: (input: PostToolUseHookInput) => Promise<HookJSONOutput>): HookCallback {
    return (input, _toolUseID, _options) => fn(input as PostToolUseHookInput);
}

function wrapSubagentStopHook(fn: (input: SubagentStopHookInput) => Promise<HookJSONOutput>): HookCallback {
    return (input, _toolUseID, _options) => fn(input as SubagentStopHookInput);
}

// ── Public API ───────────────────────────────────────────────────────

export function createHooks(_options?: { cwd?: string }): { hooks: SDKHooks } {
    const preCommitHook = wrapPreToolHook(createPreCommitHook());
    const rewritesHook = wrapPreToolHook(createRewritesHook());
    const guardsHook = wrapPreToolHook(createGuardsHook());
    const { preToolHook, postToolHook } = createSupervisorHooks();
    const supervisorPreHook = wrapPreToolHook(preToolHook);
    const supervisorPostHook = wrapPostToolHook(postToolHook);
    const postAgentChecksHook = wrapSubagentStopHook(createPostAgentChecksHook());

    return {
        hooks: {
            PreToolUse: [{ matcher: "Bash", hooks: [preCommitHook, rewritesHook] }, { hooks: [guardsHook, supervisorPreHook] }],
            PostToolUse: [{ matcher: "Bash", hooks: [supervisorPostHook] }],
            SubagentStop: [{ hooks: [postAgentChecksHook] }]
        }
    };
}
