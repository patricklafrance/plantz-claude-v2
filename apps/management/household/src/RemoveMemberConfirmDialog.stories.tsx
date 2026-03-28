import type { Meta, StoryObj } from "@storybook/react-vite";
import { delay, http, HttpResponse } from "msw";
import { userEvent, within } from "storybook/test";

import type { MemberRow } from "./MemberList.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { RemoveMemberConfirmDialog } from "./RemoveMemberConfirmDialog.tsx";

const HOUSEHOLD_ID = "household-1";

const removeMember: MemberRow = {
    id: "member-bob",
    name: "Bob",
    email: "bob@example.com",
    joinedAt: new Date(2025, 0, 15),
    isOwner: false
};

const meta = {
    title: "Management/Household/Components/RemoveMemberConfirmDialog",
    component: RemoveMemberConfirmDialog,
    args: {
        householdId: HOUSEHOLD_ID,
        open: true,
        onOpenChange: () => {},
        onRemoved: () => {}
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
} satisfies Meta<typeof RemoveMemberConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] Remove confirmation dialog with a member target
export const WithMember: Story = {
    args: {
        member: removeMember
    }
};

// [visual] Null member — dialog renders nothing
export const NullMember: Story = {
    args: {
        member: null
    }
};

// [visual] Dialog in closed state
export const Closed: Story = {
    args: {
        member: removeMember,
        open: false
    }
};

// [interactive] Confirming removal -> the Remove button shows a loading state.
// Tagged "!test" — same timing constraint as DeletingLoadingState in DeleteHouseholdConfirmDialog.
export const RemovingLoadingState: Story = {
    tags: ["!test"],
    args: {
        member: removeMember
    },
    parameters: {
        msw: {
            handlers: [
                ...createManagementHouseholdHandlers([
                    { id: HOUSEHOLD_ID, name: "Green House", ownerId: "user-alice", createdAt: new Date(2024, 0, 1) }
                ]),
                http.delete(`/api/management/households/${HOUSEHOLD_ID}/members/:memberId`, async () => {
                    await delay("infinite");

                    return new HttpResponse(null, { status: 204 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);

        const removeButton = await body.findByRole("button", { name: /^remove$/i });
        await userEvent.click(removeButton);

        await body.findByText("Removing...");
    }
};
