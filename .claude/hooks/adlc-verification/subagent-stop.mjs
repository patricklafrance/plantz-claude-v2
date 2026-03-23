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

// ── Stdin ──────────────────────────────────────────────────

const input = JSON.parse(readFileSync(0, "utf8"));

// Already in a stop-hook continuation — let it through to avoid loops.
if (input.stop_hook_active) {
    process.exit(0);
}

const { agent_type: agentType, cwd } = input;

// ── Handlers ───────────────────────────────────────────────
//
// Each handler receives `cwd` and returns (or resolves to) a string[]
// of problems. Empty array → pass.  Non-empty → block.

/**
 * _adlc-architect
 *
 * Reads the plan and evaluates structural soundness.
 * Pass → no output file.  Fail → writes .adlc/architect-revision.md.
 * Both are valid outcomes — the architect's job is to make a decision.
 */
function handleArchitect() {
    const problems = [];

    // TODO: architect-specific checks

    return problems;
}

/**
 * _adlc-domain-mapper
 *
 * Analyzes a feature and produces a module placement mapping.
 * Expected deliverable: .adlc/domain-mapping.md
 */
function handleDomainMapper() {
    const problems = [];

    // TODO: domain-mapper-specific checks

    return problems;
}

/**
 * _adlc-planner
 *
 * Drafts a multi-slice technical plan.
 * Expected deliverables:
 * - .adlc/plan-header.md
 * - At least one .adlc/slices/NN-*.md
 */
function handlePlanner() {
    const problems = [];

    // TODO: planner-specific checks

    return problems;
}

/**
 * _adlc-reviewer
 *
 * Verifies a slice's acceptance criteria via browser automation.
 * Expected deliverable: .adlc/verification-results.md
 */
function handleReviewer() {
    const problems = [];

    // TODO: reviewer-specific checks

    return problems;
}

// ── Router ─────────────────────────────────────────────────

const handlers = {
    "_adlc-architect": handleArchitect,
    "_adlc-coder": handleCoder,
    "_adlc-domain-mapper": handleDomainMapper,
    "_adlc-planner": handlePlanner,
    "_adlc-reviewer": handleReviewer
};

const handle = handlers[agentType];

// No handler for this agent (e.g. _adlc-coordinator, _adlc-pr) → allow.
if (!handle) {
    process.exit(0);
}

const problems = await Promise.resolve(handle(cwd));

if (problems.length === 0) {
    process.exit(0);
}

// Block: feed failures back to the agent so it can fix them.
process.stdout.write(
    JSON.stringify({
        decision: "block",
        reason: `${agentType} post-completion checks failed.\n\n${problems.join("\n\n")}`
    })
);
