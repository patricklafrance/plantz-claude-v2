/** Step 6: Create pull request. */

import { type AgentDefinition, runAgent } from "../agents.js";
import type { Progress } from "../../progress.js";

export async function runPr(featureDescription: string, cwd: string, agents: Record<string, AgentDefinition>, progress?: Progress): Promise<void> {
    progress?.log("post", "Creating pull request...");
    await runAgent("pr", `Create PR for: ${featureDescription}`, cwd, agents);
}
