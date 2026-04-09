/** Step 4: Simplify and clean up the implementation. */

import { type AgentDefinition, runAgent } from "../agents/loader.js";
import type { Progress } from "../../progress.js";

export async function runSimplify(cwd: string, agents: Record<string, AgentDefinition>, progress?: Progress): Promise<void> {
    progress?.log("post", "Running simplify pass...");
    await runAgent("simplify", "Review and simplify the implementation.", cwd, agents);
}
