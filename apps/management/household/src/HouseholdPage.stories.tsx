import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { userEvent, within, waitFor } from "storybook/test";

import { HouseholdPage } from "./HouseholdPage.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const SEED_HOUSEHOLD = {
    id: "household-1",
    name: "Green House",
    ownerId: "user-alice",
    createdAt: new Date(2024, 0, 1)
};

const SEED_MEMBERS = [
    {
        id: "member-alice",
        householdId: "household-1",
        userId: "user-alice",
        name: "Alice",
        email: "alice@example.com",
        joinedAt: new Date(2025, 0, 1)
    },
    {
        id: "member-bob",
        householdId: "household-1",
        userId: "user-bob",
        name: "Bob",
        email: "bob@example.com",
        joinedAt: new Date(2025, 0, 15)
    }
];

const SEED_ASSIGNMENTS = [
    {
        id: "household-1-plant-1",
        householdId: "household-1",
        plantId: "plant-1",
        plantName: "Monstera Deliciosa",
        assignmentType: "fixed" as const,
        assignedUserId: "user-alice",
        assignedMemberName: "Alice"
    },
    {
        id: "household-1-plant-2",
        householdId: "household-1",
        plantId: "plant-2",
        plantName: "Fiddle Leaf Fig",
        assignmentType: "rotating" as const,
        assignedUserId: undefined,
        assignedMemberName: undefined
    },
    {
        id: "household-1-plant-3",
        householdId: "household-1",
        plantId: "plant-3",
        plantName: "Snake Plant",
        assignmentType: "unassigned" as const,
        assignedUserId: undefined,
        assignedMemberName: undefined
    }
];

const meta = {
    title: "Management/Household/Pages/HouseholdPage",
    component: HouseholdPage,
    decorators: [collectionDecorator, fireflyDecorator],
    parameters: {
        chromatic: {
            modes: {
                "light mobile": { theme: "light", viewport: 375 },
                "light tablet": { theme: "light", viewport: 768 },
                "light desktop": { theme: "light", viewport: 1280 },
                "dark mobile": { theme: "dark", viewport: 375 },
                "dark tablet": { theme: "dark", viewport: 768 },
                "dark desktop": { theme: "dark", viewport: 1280 }
            }
        }
    }
} satisfies Meta<typeof HouseholdPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] HouseholdPage (empty state): shows "You don't have a household yet" with Create button
export const Empty: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([]) }
    }
};

// [visual] HouseholdPage (with household): shows name, creation date, member list, edit and delete buttons
export const WithHousehold: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS) }
    }
};

// [visual] HouseholdPage: shows assignments section with mixed assignment types
export const WithAssignments: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS, SEED_ASSIGNMENTS) }
    }
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers("loading") }
    }
};

// [interactive] After creating a household -> the HouseholdPage displays the newly created household
export const AfterCreate: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Dialogs render in a portal outside canvasElement — scope those queries to body
        const body = within(canvasElement.ownerDocument.body);

        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);

        const nameInput = await body.findByLabelText(/name \*/i);
        await userEvent.type(nameInput, "New Household");

        // Wait for the Create button to become enabled after typing
        const submitButton = await body.findByRole("button", { name: /^create$/i });
        await waitFor(() => {
            if ((submitButton as HTMLButtonElement).disabled) {
                throw new Error("Create button is still disabled");
            }
        });
        await userEvent.click(submitButton);

        await canvas.findByText("New Household");
    }
};

// [interactive] After editing -> the HouseholdPage displays the updated household name
export const AfterEdit: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Dialogs render in a portal outside canvasElement — scope those queries to body
        const body = within(canvasElement.ownerDocument.body);

        const editButton = await canvas.findByRole("button", { name: /edit green house/i });
        await userEvent.click(editButton);

        const nameInput = await body.findByLabelText(/name \*/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Updated House");

        // Wait for the Save button to become enabled
        const saveButton = await body.findByRole("button", { name: /^save$/i });
        await waitFor(() => {
            if ((saveButton as HTMLButtonElement).disabled) {
                throw new Error("Save button is still disabled");
            }
        });
        await userEvent.click(saveButton);

        await canvas.findByText("Updated House");
    }
};

// [interactive] After deleting -> the HouseholdPage shows the empty state
export const AfterDelete: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Dialogs render in a portal outside canvasElement — scope those queries to body
        const body = within(canvasElement.ownerDocument.body);

        const deleteButton = await canvas.findByRole("button", { name: /delete green house/i });
        await userEvent.click(deleteButton);

        const confirmButton = await body.findByRole("button", { name: /^delete$/i });
        await userEvent.click(confirmButton);

        await canvas.findByText(/you don't have a household yet/i);
    }
};

// [interactive] Clicking "Invite Member" opens the InviteMemberDialog.
// After inviting -> the MemberList displays the newly added member.
export const AfterInviteMember: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);

        const emailInput = await body.findByLabelText(/email \*/i);
        await userEvent.type(emailInput, "charlie@example.com");

        const submitButton = await body.findByRole("button", { name: /^invite$/i });
        await userEvent.click(submitButton);

        // Dialog should close and new member should appear in the list
        await canvas.findByText("Charlie");
    }
};

// [interactive] Submitting an unknown email -> the dialog shows a "User not found" error without closing.
export const InviteUnknownEmail: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS),
                http.post("/api/management/households/:id/members", () => {
                    return HttpResponse.json({ error: "User not found" }, { status: 422 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);

        const emailInput = await body.findByLabelText(/email \*/i);
        await userEvent.type(emailInput, "unknown@example.com");

        const submitButton = await body.findByRole("button", { name: /^invite$/i });
        await userEvent.click(submitButton);

        await body.findByText(/user not found/i);
    }
};

// [interactive] Clicking "Remove" -> a confirmation prompt appears. After confirming -> member disappears.
export const AfterRemoveMember: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        // Wait for the member list to render
        await canvas.findByText("Bob");

        const removeButton = await canvas.findByRole("button", { name: /remove bob/i });
        await userEvent.click(removeButton);

        // Confirmation dialog should appear
        const confirmButton = await body.findByRole("button", { name: /^remove$/i });
        await userEvent.click(confirmButton);

        // Bob should disappear from the list
        await waitFor(() => {
            const rows = canvasElement.querySelectorAll("[role='row']");
            const hasBob = Array.from(rows).some(r => r.textContent?.includes("Bob"));

            if (hasBob) {
                throw new Error("Bob is still in the list");
            }
        });
    }
};

// [interactive] Clicking "Edit" on an assignment row opens the EditAssignmentDialog pre-filled
export const EditFixedAssignment: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS, SEED_ASSIGNMENTS) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        // Wait for the assignment list to render
        await canvas.findByText("Monstera Deliciosa");

        const editButton = await canvas.findByRole("button", { name: /edit assignment for monstera deliciosa/i });
        await userEvent.click(editButton);

        // Dialog should open pre-filled with "fixed" selected
        await body.findByRole("radio", { name: /fixed/i });
    }
};

// [interactive] Switching assignment to "Fixed" and choosing a member, then saving -> row updates
// Uses a single-plant seed to keep the "Bob" assertion unambiguous (Bob also appears in the Members
// table, so we scope the check to the assignment row's specific cell)
export const AfterSaveFixedAssignment: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS, [
                { id: "household-1-plant-3", householdId: "household-1", plantId: "plant-3", plantName: "Snake Plant", assignmentType: "unassigned" }
            ])
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        // Wait for Snake Plant (unassigned) to render
        await canvas.findByText("Snake Plant");

        const editButton = await canvas.findByRole("button", { name: /edit assignment for snake plant/i });
        await userEvent.click(editButton);

        // Select "Fixed"
        const fixedRadio = await body.findByRole("radio", { name: /fixed/i });
        await userEvent.click(fixedRadio);

        // Select Bob as the member
        const memberSelect = await body.findByRole("combobox");
        await userEvent.click(memberSelect);
        const bobOption = await body.findByRole("option", { name: /bob/i });
        await userEvent.click(bobOption);

        const saveButton = await body.findByRole("button", { name: /^save$/i });
        await userEvent.click(saveButton);

        // The assignment row should now show Bob — check within the assignments table only
        const assignmentTable = await canvas.findByRole("table", { name: /plant responsibility assignments/i });
        await within(assignmentTable).findByText("Bob");
    }
};

// [interactive] Switching from "Fixed" to "Rotating" and saving -> row updates to "Rotating"
// Single-plant seed so the only "Rotating" text that can appear is from the updated row
export const AfterSaveRotatingAssignment: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS, [
                {
                    id: "household-1-plant-1",
                    householdId: "household-1",
                    plantId: "plant-1",
                    plantName: "Monstera Deliciosa",
                    assignmentType: "fixed",
                    assignedUserId: "user-alice"
                }
            ])
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        // Wait for Monstera Deliciosa (fixed / Alice) to render
        const assignmentTable = await canvas.findByRole("table", { name: /plant responsibility assignments/i });
        await within(assignmentTable).findByText("Alice");

        const editButton = await canvas.findByRole("button", { name: /edit assignment for monstera deliciosa/i });
        await userEvent.click(editButton);

        // Switch to "Rotating"
        const rotatingRadio = await body.findByRole("radio", { name: /rotating/i });
        await userEvent.click(rotatingRadio);

        const saveButton = await body.findByRole("button", { name: /^save$/i });
        await userEvent.click(saveButton);

        // The row should now show "Rotating" instead of Alice
        await within(assignmentTable).findByText("Rotating");
    }
};

// [interactive] Switching to "Unassigned" and saving -> row updates to "Anyone"
// Single-plant seed so the only "Anyone" text comes from the updated row
export const AfterSaveUnassignedAssignment: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD], SEED_MEMBERS, [
                {
                    id: "household-1-plant-1",
                    householdId: "household-1",
                    plantId: "plant-1",
                    plantName: "Monstera Deliciosa",
                    assignmentType: "fixed",
                    assignedUserId: "user-alice"
                }
            ])
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);

        // Wait for Monstera Deliciosa (fixed / Alice) to render
        const assignmentTable = await canvas.findByRole("table", { name: /plant responsibility assignments/i });
        await within(assignmentTable).findByText("Alice");

        const editButton = await canvas.findByRole("button", { name: /edit assignment for monstera deliciosa/i });
        await userEvent.click(editButton);

        // Switch to "Unassigned"
        const unassignedRadio = await body.findByRole("radio", { name: /unassigned/i });
        await userEvent.click(unassignedRadio);

        const saveButton = await body.findByRole("button", { name: /^save$/i });
        await userEvent.click(saveButton);

        // The row for Monstera should now show "Anyone"
        await within(assignmentTable).findByText("Anyone");
    }
};
