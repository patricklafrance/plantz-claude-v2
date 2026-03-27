# Pre-commit

Commit-time validation for `git commit` Bash commands.

This hook family intercepts commit attempts and runs a small validation pipeline before allowing the commit to proceed.

It is narrower than `adlc-verification` and `supervisor`:

- it only cares about `git commit`
- it runs on `PreToolUse/Bash`
- it validates the repo state before the commit happens

## What it improves in the harness

`pre-commit` turns a commit into a final gate instead of a best-effort action.

Concretely, it improves the harness by:

- preventing commits that skip the repo’s baseline validation
- auto-fixing formatting before the commit is evaluated
- keeping `.gitignore` from accidentally re-including ephemeral ADLC artifacts

That makes commit creation less dependent on the agent remembering the exact local validation sequence.

## Hook entrypoint

- `pre-tool-use-bash.mjs`
    - Registered on `PreToolUse` for `Bash`
    - Only activates for `git commit` commands, including RTK-wrapped forms

Flow:

1. Parse the incoming Bash command
2. If it is not a `git commit`, allow immediately
3. Run the pre-commit pipeline
4. If problems remain, block the command and return the combined failures

## Main handler

- `handler.mjs`

Pipeline:

1. `oxfmt-autofix`
    - auto-format files
    - stage any formatting changes
2. run in parallel:
    - `lint`
    - `tests`
    - `gitignore-guard`

The handler returns:

- `[]` -> allow commit
- `string[]` -> block commit

## Public hook contract

`pre-commit` returns:

- allow:
    - no output

- block:
    - `decision: "block"`
    - `reason: "Pre-commit checks failed..."`

Only commit commands are intercepted. Other Bash commands pass through untouched.
