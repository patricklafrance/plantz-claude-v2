/** Step 5: Update documentation. */

import { type AgentDefinition, runAgent } from "../agents/loader.js";
import type { Progress } from "../../progress.js";

export async function runDocument(cwd: string, agents: Record<string, AgentDefinition>, progress?: Progress): Promise<void> {
    progress?.log("post", "Updating documentation...");
    await runAgent("document", "Update documentation.", cwd, agents);
}
