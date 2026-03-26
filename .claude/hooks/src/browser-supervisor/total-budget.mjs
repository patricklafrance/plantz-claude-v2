/**
 * Total budget — hard cap on browser calls per run.
 */

export const BUDGET = 40;

function message(n) {
    return `[browser-supervisor] Browser call budget exceeded (${n}/${BUDGET}). Fix the issue in source code or simplify your verification.`;
}

/**
 * @param {object} state — reads totalBrowserCalls
 * @returns {{ action: "block", reason: string } | null}
 *   null = this control doesn't apply
 */
export function totalBudget(state) {
    if (state.totalBrowserCalls > BUDGET) {
        return { action: "block", reason: message(state.totalBrowserCalls) };
    }

    return null;
}
