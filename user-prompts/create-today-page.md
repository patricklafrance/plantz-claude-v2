# Today Page & List Item Redesign

## What I want

Three changes to the plants watering application:

### 1. Today page

A new page showing only the plants that are due for watering as of today. It should work like the plants list page — same filterable, virtualized list with selection and bulk delete — but scoped to plants that need watering now. The "Due for watering" filter toggle doesn't make sense here since every plant on this page is already due. No "New plant" button either — this is a view for today's tasks, not for managing the collection.

### 2. List item redesign

The current list item stacks secondary info (watering quantity, type, location) on a second line below the plant name. I want those fields on the same row as the name and actions instead — a single-row layout. This change should apply everywhere a plant list item appears (both pages).

### 3. Plants list as home page

Once the today page exists, make the plants list page the home page of the application. Navigating to `/` should land on the plants list.

## Use the ADLC orchestrator

Build this feature using the `plantz-adlc-orchestrator` skill.
