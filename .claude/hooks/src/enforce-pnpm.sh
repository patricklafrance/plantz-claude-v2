#!/usr/bin/env bash

# PreToolUse/Bash — enforce pnpm as the sole package manager.
# Blocks npm, npx, pnpx, and pnpm dlx (including rtk-wrapped forms).
# Checks each segment in chained commands (&&, ||, ;).

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)

[ -z "$COMMAND" ] && exit 0

# Split chained commands into separate lines for individual checking.
SEGMENTS=$(echo "$COMMAND" | sed 's/ *&& */\n/g; s/ *|| */\n/g; s/ *; */\n/g')

while IFS= read -r SEG; do
    # Trim leading whitespace
    SEG="${SEG#"${SEG%%[![:space:]]*}"}"
    [ -z "$SEG" ] && continue

    # Strip optional rtk prefix
    case "$SEG" in
        rtk\ *) BARE="${SEG#rtk }" ;;
        *) BARE="$SEG" ;;
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
done <<< "$SEGMENTS"

exit 0
