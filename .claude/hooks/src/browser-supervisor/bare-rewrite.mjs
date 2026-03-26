/**
 * Bare rewrite — rewrites bare `agent-browser` invocations to `pnpm exec agent-browser`.
 *
 * Catches bare invocations at the start of a command or after &&, ||, ;.
 * Returns the rewritten command, or null if no rewrite was needed.
 */

export function rewriteBareAgent(command) {
    const rewritten = command.replace(/(^|&&\s*|\|\|\s*|;\s*)agent-browser\b/g, "$1pnpm exec agent-browser");
    return rewritten !== command ? rewritten : null;
}
