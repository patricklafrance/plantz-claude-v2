#!/usr/bin/env node

/**
 * SubagentStop hook — runs post-completion pipelines for ADLC subagents.
 *
 * Each agent type gets a handler that can autofix, validate, and clean up.
 * Handlers return a list of problems: empty → allow stop, non-empty → block.
 *
 * Exit 0 + no output        → allow stop
 * Exit 0 + JSON { decision } → block stop, feed reason back to Claude
 */

import { readFileSync } from "node:fs";

import handleCoder from "./coder/handler.mjs";
import handleDocument from "./document/handler.mjs";
import handleModuleMapper from "./domain-mapper/handler.mjs";
import handleEvidenceResearcher from "./evidence-researcher/handler.mjs";
import handlePlacementGate from "./placement-gate/handler.mjs";
import handlePlanGate from "./plan-gate/handler.mjs";
import handlePlanner from "./planner/handler.mjs";
import handleReviewer from "./reviewer/handler.mjs";
import { recordMetrics } from "./run-metrics.mjs";
import handleSimplify from "./simplify/handler.mjs";
// ── Stdin ──────────────────────────────────────────────────

const input = JSON.parse(readFileSync(0, "utf8"));

// Already in a stop-hook continuation — let it through to avoid loops.
// Still record metrics: the transcript now covers the full run including retries.
if (input.stop_hook_active) {
    recordMetrics(input.agent_transcript_path, input.agent_type, input.cwd);
    process.exit(0);
}

const { agent_type: agentType, agent_transcript_path: transcriptPath, cwd } = input;

// ── Handlers ───────────────────────────────────────────────
//
// Each handler receives `cwd` and returns (or resolves to) a string[]
// of problems. Empty array → pass.  Non-empty → block.

// _adlc-plan-gate — imported from ./plan-gate/handler.mjs
// _adlc-document — imported from ./document/handler.mjs
// _adlc-domain-mapper — imported from ./domain-mapper/handler.mjs
// _adlc-planner — imported from ./planner/handler.mjs
// _adlc-reviewer — imported from ./reviewer/handler.mjs

// ── Router ─────────────────────────────────────────────────

const handlers = {
    "_adlc-plan-gate": handlePlanGate,
    "_adlc-coder": handleCoder,
    "_adlc-document": handleDocument,
    "_adlc-placement-gate": handlePlacementGate,
    "_adlc-domain-mapper": handleModuleMapper,
    "_adlc-evidence-researcher": handleEvidenceResearcher,
    "_adlc-planner": handlePlanner,
    "_adlc-reviewer": handleReviewer,
    "_adlc-simplify": handleSimplify
};

const handle = handlers[agentType];

// No handler for this agent (e.g. _adlc, _adlc-pr) → record metrics and allow.
if (!handle) {
    recordMetrics(transcriptPath, agentType, cwd);
    process.exit(0);
}

const problems = await Promise.resolve(handle(cwd));

if (problems.length === 0) {
    recordMetrics(transcriptPath, agentType, cwd);
    process.exit(0);
}

// Block: feed failures back to the agent so it can fix them.
process.stdout.write(
    JSON.stringify({
        decision: "block",
        reason: `${agentType} post-completion checks failed.\n\n${problems.join("\n\n")}`
    })
);
