/**
 * Screenshot nudge — one-shot redirect toward DOM-based checks.
 *
 * Blocks the first `screenshot` command and suggests alternatives.
 * Subsequent screenshots are allowed through.
 */

const MESSAGE = [
    "[browser-supervisor] For functional checks, prefer DOM queries over screenshots:",
    "",
    "- `pnpm exec agent-browser diff snapshot` — what changed after an action",
    "- `pnpm exec agent-browser eval --stdin <<'EOF'`",
    "  `JSON.stringify({ hasDialog: !!document.querySelector('[role=dialog]') })`",
    "  `EOF`",
    "- `pnpm exec agent-browser is visible <selector>`",
    "",
    "Reserve screenshots for visual layout verification."
].join("\n");

/**
 * @param {boolean} isScreenshot
 * @param {object} state — mutated in place if nudge fires
 * @returns {{ action: "allow" } | { action: "block", reason: string } | null}
 *   null = this control doesn't apply, let the next one decide
 */
export function screenshotNudge(isScreenshot, state) {
    if (isScreenshot && !state.screenshotNudgeFired) {
        state.screenshotNudgeFired = true;

        return { action: "block", reason: MESSAGE };
    }

    return null;
}
