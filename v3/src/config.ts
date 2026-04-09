/** Model aliases → full model IDs. */
export const MODEL_IDS = {
    sonnet: "claude-sonnet-4-6",
    opus: "claude-opus-4-6",
    haiku: "claude-haiku-4-5-20251001"
} as const;

/** Resolve a model alias or full ID. */
export function resolveModel(alias: string | undefined): string | undefined {
    if (!alias) return undefined;
    return MODEL_IDS[alias as keyof typeof MODEL_IDS] ?? alias;
}

/** Default orchestrator settings. */
export const DEFAULTS = {
    /** Max USD budget per slice. */
    budgetPerSlice: 15,
    /** Max parallel slices per wave. */
    maxParallel: 5,
    /** Max coder ↔ reviewer iterations per slice. */
    maxRevisionAttempts: 5,
    /** Max domain-mapper ↔ placement-gate iterations. */
    maxDomainMappingAttempts: 3,
    /** Max planner ↔ challenger iterations. */
    maxPlanAttempts: 5
} as const;

/** Port allocation base for parallel worktrees. */
export const PORT_BASE = {
    storybook: 6100,
    hostApp: 8100,
    browser: 9200
} as const;
