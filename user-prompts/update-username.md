# Edit Username via Profile Page

## What I want

Add a profile page where the authenticated user can edit their username. The page should only be accessible from the user ribbon (top-right avatar/popover), and any username change should immediately reflect in the ribbon.

### 1. Profile page

A simple page with a form to edit the current user's username. The form should pre-fill with the current username and save the change through the MSW layer. No email editing, no password change, no avatar upload — just the username.

### 2. Link from the user ribbon

Add an "Edit profile" entry inside the user menu popover. Clicking it navigates to the profile page. This should be the only way to reach the profile page — do not add it to the main navigation bar.

### 3. Ribbon auto-updates after username change

After saving a new username, the ribbon avatar initials and the popover name should update automatically without a page reload.

### 4. Host-level route

The profile page is a cross-cutting concern, not domain-specific. Register it in the host app alongside the existing login and not-found routes — not as a separate Squide module.

## Use the ADLC orchestrator

Build this feature using the `plantz-adlc-orchestrator` skill.
