/** Step 2: Plan draft with adversarial challenge loop. */

import { type AgentDefinition, runAgent } from "../agents/loader.js";
import { DEFAULTS } from "../../config.js";
import type { Progress } from "../../progress.js";

export async function runPlan(featureDescription: string, cwd: string, agents: Record<string, AgentDefinition>, progress?: Progress): Promise<void> {
    for (let attempt = 0; attempt < DEFAULTS.maxPlanAttempts; attempt++) {
        const mode = attempt === 0 ? "draft" : "revision";
        progress?.log("plan", `Plan ${mode} attempt ${attempt + 1}/${DEFAULTS.maxPlanAttempts}`);

        await runAgent("planner", `${mode === "draft" ? "Draft" : "Revise"} the implementation plan for: ${featureDescription}`, cwd, agents);

        await runAgent("plan-gate", "Validate the plan structure.", cwd, agents);

        // Adversarial challenge -- challengers in parallel
        const [_cohesionResult, _sprawlResult] = await Promise.all([
            runAgent("cohesion-challenger", "Check extend decisions for god-module risk.", cwd, agents),
            runAgent("sprawl-challenger", "Challenge create decisions with extension proposals.", cwd, agents)
        ]);

        // Arbiter synthesizes
        const verdict = await runAgent("challenge-arbiter", "Synthesize challenger debate into unified verdict.", cwd, agents);

        if (verdict.toLowerCase().includes("approved")) {
            progress?.log("plan", "Plan approved by arbiter");
            break;
        }

        progress?.log("plan", "Plan not approved, starting revision...");
    }
}
