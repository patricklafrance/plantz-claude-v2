#!/usr/bin/env bash

# PreToolUse/Bash — RTK command rewrite.
# Rewrites supported commands through rtk for token-compressed output.
# Graceful no-op when rtk is not installed.

# Bail immediately if rtk is not installed — avoids stdin/JSON overhead on every Bash call.
RTK_PATH=$(command -v rtk 2>/dev/null) || exit 0

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)

[ -z "$COMMAND" ] && exit 0

# Skip already-prefixed commands.
case "$COMMAND" in
    rtk\ *) exit 0 ;;
esac

# Skip heredocs — rtk cannot rewrite multi-line shell constructs.
case "$COMMAND" in
    *"<<"*) exit 0 ;;
esac

# Attempt rewrite. rtk rewrite exits 0 with rewritten command, 1 if no rewrite.
REWRITTEN=$("$RTK_PATH" rewrite "$COMMAND" 2>/dev/null) || exit 0

if [ -n "$REWRITTEN" ]; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","updatedInput":{"command":"%s"}}}' "$REWRITTEN"
fi
