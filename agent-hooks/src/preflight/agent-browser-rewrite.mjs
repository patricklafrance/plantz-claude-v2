/**
 * Rewrites bare `agent-browser` invocations to `pnpm exec agent-browser`.
 *
 * This is a generic Bash normalization concern, so it belongs in tool-guardrails
 * rather than the supervisor.
 */
export function rewriteBareAgent(command) {
    const rewritten = String(command ?? "").replace(/(^|&&\s*|\|\|\s*|;\s*)agent-browser\b/g, "$1pnpm exec agent-browser");

    return rewritten !== command ? rewritten : null;
}
