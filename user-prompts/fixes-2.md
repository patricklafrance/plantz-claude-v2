# Fixes 2

## What I want

Apply the following UX and UI fixes across the application:

### 1. Cursor indicator on clickable elements

Every clickable element should show a pointer cursor on hover.

### 2. Remove edit action from Today's list

In the Today's page, clicking the pencil icon opens a view-only modal — a pencil icon implies editing, which is misleading. Remove all action buttons from Today's list items. Instead, clicking a list item should open the detail view directly.

### 3. Fix filter bar padding in the application

The filter bar has no top and bottom padding. It looks correct in Storybook stories (when starting from "pnpm dev-storybook"), but not in the application itself. Something seems to be missing — investigate the difference between Storybook and the app.

### 4. Increase base font size

The font size is too small across the application. Find and apply a better base font size.

### 5. Fix list item styling in the application

List items now display all information on a single line, but the styling is poor. It looks correct in Storybook stories (when starting from "pnpm dev-storybook"), but not in the application itself. Something seems to be missing — investigate the difference between Storybook and the app.

## Use the ADLC orchestrator

Build this task using the `plantz-adlc-orchestrator` skill.
