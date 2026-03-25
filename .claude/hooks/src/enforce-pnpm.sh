#!/usr/bin/env bash

# PreToolUse/Bash — enforce pnpm as the sole package manager.
# Blocks npm, npx, pnpx, and pnpm dlx (including rtk-wrapped forms).

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)

# Strip optional rtk prefix so guards match both raw and wrapped forms.
case "$COMMAND" in
    rtk\ *) BARE="${COMMAND#rtk }" ;;
    *) BARE="$COMMAND" ;;
esac

if echo "$BARE" | grep -qE "^npm( |$)"; then
    echo "Blocked: use pnpm instead of npm." >&2
    exit 2
fi

if echo "$BARE" | grep -qE "^npx( |$)"; then
    echo "Blocked: use pnpm exec instead of npx." >&2
    exit 2
fi

if echo "$BARE" | grep -qE "^pnpx( |$)"; then
    echo "Blocked: pnpx is not allowed. Use pnpm exec instead." >&2
    exit 2
fi

if echo "$BARE" | grep -qE "^pnpm dlx( |$)"; then
    echo "Blocked: pnpm dlx is not allowed. Use pnpm exec instead." >&2
    exit 2
fi

exit 0
