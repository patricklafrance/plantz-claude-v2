# Rework lists to use the browser's native scrollbar

## What I want

Both the Management plants list and the Today plants list currently scroll inside their own fixed-height containers. Each list has its own scrollbar trapped inside the list box rather than using the main browser window scrollbar.

Rework the layout so that the **browser's native window scrollbar** is the one that scrolls the list content. The page header, filters, and list header should scroll away naturally as the user scrolls down through the list items — standard document-flow scrolling.

### Requirements

- The full page (header, filters, status, list) should participate in normal document flow so the browser window scrollbar controls scrolling.
- The list header row (column labels) does **not** need to be sticky — it can scroll away with the rest of the content.
- TanStack Virtual must still work correctly — list virtualization must remain functional with the new scroll behavior.
- Apply the same pattern to both the Management and Today pages — they should behave identically.

### Out of scope

- No visual redesign — keep the existing look and feel. Only the scroll behavior changes.
- Do not change dialog/modal scroll behavior.

## Use the ADLC orchestrator

Build this task using the `plantz-adlc-orchestrator` skill.
