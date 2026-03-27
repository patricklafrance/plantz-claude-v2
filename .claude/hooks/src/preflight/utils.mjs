/**
 * Shared helpers for PreToolUse tool guardrails.
 */

const SEGMENT_SPLIT = /\s*(?:&&|\|\||;)\s*/;

export function splitCommandSegments(command) {
    return command
        .split(SEGMENT_SPLIT)
        .map(segment => segment.trim())
        .filter(Boolean);
}

export function stripRtkPrefix(segment) {
    return segment.startsWith("rtk ") ? segment.slice(4).trimStart() : segment;
}

export function pathIncludesNodeModules(path) {
    return /(^|[\\/])node_modules([\\/]|$)/.test(path);
}
