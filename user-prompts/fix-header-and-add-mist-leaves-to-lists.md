# Fix header layout and add mist leaves column to plant lists

## What I want

### 1. Move "Select all" checkbox inline with header labels

In the Management plants page, the "Select all" checkbox currently sits in its own dedicated row above the column header labels. Move it so the checkbox appears on the same line as the column labels, before the "Name" label. The dedicated "Select all" row should be removed.

### 2. Drop the "Select all" label on desktop, keep it on mobile

On desktop viewports (where the column labels are visible), the select-all checkbox should render without any visible label text — the column headers already provide context.

On mobile viewports (where the column labels are hidden), show the "Select all" label next to the checkbox so users still understand what it does.

### 3. Fix column alignment between header and rows

The "Watering Qty", "Watering Type", and "Location" header labels are offset by roughly 5–10 px from the corresponding values in the list rows. This misalignment is visible in the Today Storybook but not in the packages Storybook or the Management Storybook. Investigate and fix the root cause so headers and row values line up consistently everywhere.

### 4. Add "Mist Leaves" column to both lists

The plant data model already has a `mistLeaves` boolean field. Add a "Mist Leaves" column to the header and rows in both the Management and Today plant lists:

- Header label: "Mist Leaves".
- Row value: display a checkmark icon when `true`; display nothing when `false`.
- Update the grid layout to accommodate the new column.
- On mobile, include the mist-leaves value in the collapsed summary line (e.g., append a mist-leaves indicator after the location).

## Use the ADLC orchestrator

Build this task using the `plantz-adlc-orchestrator` skill.
