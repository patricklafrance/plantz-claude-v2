/**
 * Supervisor hooks factory — creates shared state and returns
 * the PreToolUse and PostToolUse hook pair.
 */

import { createDefaultState } from "./state.js";
import { createSupervisorPreToolHook } from "./create-supervisor-pre-tool-hook.js";
import { createSupervisorPostToolHook } from "./create-supervisor-post-tool-hook.js";

export function createSupervisorHooks() {
    const state = createDefaultState();
    return {
        state,
        preToolHook: createSupervisorPreToolHook(state),
        postToolHook: createSupervisorPostToolHook(state)
    };
}
