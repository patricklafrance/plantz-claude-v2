# Fixes 1

## What I want

Apply the following UX and UI fixes across the application:

### 1. Disable delete in Today's list

Users should not be able to delete a plant directly from the Today's list.

### 2. Open plant detail/update on list item click

Both the management plant list and the Today's list should open the plant detail or update flow when a list item is clicked.

### 3. Single-line list items on desktop

List item information should be displayed on a single line, with no secondary data wrapping onto a second line, at least on desktop viewports.

### 4. Reorder main navigation

In the main layout navigation, the `Today` link must appear before the `Plants` link.

### 5. Fix red padding in paginated lists

When a list has multiple pages, there is red padding visible at the bottom of each row. Find the cause and remove or correct that styling issue.

### 6. Fix create plant modal contrast in dark mode

The create plant modal has incorrect contrast in dark mode. Fix the relevant colors, surfaces, and text so it is readable and consistent.

### 7. Add a cancel button to the create plant modal

Add a cancel button at the bottom of the create plant modal alongside the existing primary action.

### 8. Fix update plant modal contrast in dark mode

The update plant modal has incorrect contrast in dark mode. Fix the relevant colors, surfaces, and text so it is readable and consistent.

## Use the ADLC orchestrator

Build this task using the `plantz-adlc-orchestrator` skill.
