import type { Meta, StoryObj } from "@storybook/react-vite";
import { delay, http, HttpResponse } from "msw";
import { userEvent, within } from "storybook/test";

import { InviteMemberDialog } from "./InviteMemberDialog.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";

const HOUSEHOLD_ID = "household-1";

const meta = {
    title: "Management/Household/Components/InviteMemberDialog",
    component: InviteMemberDialog,
    args: {
        householdId: HOUSEHOLD_ID,
        open: true,
        onOpenChange: () => {},
        onInvited: () => {}
    },
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
        },
        msw: {
            handlers: createManagementHouseholdHandlers([
                { id: HOUSEHOLD_ID, name: "Green House", ownerId: "user-alice", createdAt: new Date(2024, 0, 1) }
            ])
        }
    }
} satisfies Meta<typeof InviteMemberDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] InviteMemberDialog: Shows an email input field with Invite/Cancel buttons
export const Default: Story = {};

// [visual] InviteMemberDialog (error state): Shows an inline error message when the email is not found
export const ErrorState: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createManagementHouseholdHandlers([
                    { id: HOUSEHOLD_ID, name: "Green House", ownerId: "user-alice", createdAt: new Date(2024, 0, 1) }
                ]),
                http.post(`/api/management/households/${HOUSEHOLD_ID}/members`, () => {
                    return HttpResponse.json({ error: "User not found" }, { status: 422 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);

        const emailInput = await body.findByLabelText(/email \*/i);
        await userEvent.type(emailInput, "unknown@example.com");

        const inviteButton = await body.findByRole("button", { name: /^invite$/i });
        await userEvent.click(inviteButton);

        await body.findByText(/user not found/i);
    }
};

// [interactive] Submitting a valid email -> the Invite button shows a loading state
export const InvitingLoadingState: Story = {
    tags: ["!test"],
    parameters: {
        msw: {
            handlers: [
                ...createManagementHouseholdHandlers([
                    { id: HOUSEHOLD_ID, name: "Green House", ownerId: "user-alice", createdAt: new Date(2024, 0, 1) }
                ]),
                http.post(`/api/management/households/${HOUSEHOLD_ID}/members`, async () => {
                    await delay("infinite");

                    return HttpResponse.json({}, { status: 201 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);

        const emailInput = await body.findByLabelText(/email \*/i);
        await userEvent.type(emailInput, "bob@example.com");

        const inviteButton = await body.findByRole("button", { name: /^invite$/i });
        await userEvent.click(inviteButton);

        await body.findByText("Inviting...");
    }
};
