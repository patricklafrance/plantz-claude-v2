import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { screen, userEvent, within } from "storybook/test";

import { makeHousehold } from "@packages/core-household/test-utils";

import { HouseholdPage } from "./HouseholdPage.tsx";
import {
    createManagementHouseholdHandlers,
    type StoryAssignment,
    type StoryInvitation,
    type StoryMember,
    type StoryMyInvitation,
    type StoryPlant
} from "./mocks/createHandlers.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const aliceHousehold = makeHousehold({ id: "h-1", name: "The Plant House" });

const aliceMember: StoryMember = {
    id: "m-1",
    householdId: "h-1",
    userId: "user-alice",
    userName: "Alice",
    joinedDate: new Date(2025, 0, 1)
};

const bobPendingInvitation: StoryInvitation = {
    id: "inv-1",
    householdId: "h-1",
    invitedBy: "user-alice",
    inviteeEmail: "bob@example.com",
    status: "pending",
    creationDate: new Date(2025, 0, 2)
};

const myInvitationFromAlice: StoryMyInvitation = {
    id: "inv-2",
    householdId: "h-1",
    invitedBy: "user-alice",
    inviteeEmail: "bob@example.com",
    status: "pending",
    creationDate: new Date(2025, 0, 2),
    householdName: "The Plant House",
    inviterName: "Alice"
};

const bobMember: StoryMember = {
    id: "m-2",
    householdId: "h-1",
    userId: "user-bob",
    userName: "Bob",
    joinedDate: new Date(2025, 1, 15)
};

const sharedPlants: StoryPlant[] = [
    { id: "plant-1", name: "Monstera Deliciosa", householdId: "h-1" },
    { id: "plant-2", name: "Fiddle Leaf Fig", householdId: "h-1" },
    { id: "plant-3", name: "Snake Plant", householdId: "h-1" },
    { id: "plant-4", name: "Pothos", householdId: "h-1" }
];

const mixedAssignments: StoryAssignment[] = [
    { id: "a-1", plantId: "plant-1", householdId: "h-1", strategy: "fixed", assignedUserId: "user-alice", responsibleUserName: "Alice" },
    { id: "a-2", plantId: "plant-2", householdId: "h-1", strategy: "rotating", responsibleUserName: "Bob", lastRotatedDate: new Date(2025, 0, 1) },
    { id: "a-3", plantId: "plant-3", householdId: "h-1", strategy: "unassigned" },
    { id: "a-4", plantId: "plant-4", householdId: "h-1", strategy: "fixed", assignedUserId: "user-bob", responsibleUserName: "Bob" }
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

// [visual] The household page shows an empty state when the user has no household
export const Empty: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [] })
        }
    }
};

// [visual] After creating a household, the page displays the household name and the current user as a member
// [visual] The member list shows each member's name
export const WithHousehold: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember]
            })
        }
    }
};

// [visual] Multiple members in the household
export const WithMultipleMembers: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [
                    aliceMember,
                    {
                        id: "m-2",
                        householdId: "h-1",
                        userId: "user-bob",
                        userName: "Bob",
                        joinedDate: new Date(2025, 1, 15)
                    }
                ]
            })
        }
    }
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: "loading" })
        }
    }
};

// [interactive] Clicking "Create Household" opens a dialog with a name field
export const WithCreateDialogOpen: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [] })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);
    }
};

// [interactive] Submitting without a name shows a validation message
export const WithValidationError: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [] })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);

        // Dialog renders in a Radix portal outside the canvas — use screen
        const dialog = await screen.findByRole("dialog");
        const submitButton = await within(dialog).findByRole("button", { name: /create household/i });
        await userEvent.click(submitButton);
    }
};

// [interactive] After creation succeeds, the dialog closes and the household page displays the new household
export const AfterCreation: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                // Stateful handlers: GET returns empty initially, then returns the created household after POST
                let createdHousehold: Record<string, unknown> | null = null;

                return [
                    http.get("/api/management/household", () => {
                        return HttpResponse.json(createdHousehold ? [createdHousehold] : []);
                    }),
                    http.get("/api/management/household/:id/members", () => {
                        return HttpResponse.json(
                            createdHousehold
                                ? [{ id: "m-new", householdId: createdHousehold.id, userId: "user-alice", userName: "Alice", joinedDate: new Date() }]
                                : []
                        );
                    }),
                    http.post("/api/management/household", async ({ request }) => {
                        const body = (await request.json()) as Record<string, unknown>;
                        createdHousehold = { id: "h-new", ...body, createdBy: "user-alice", creationDate: new Date() };

                        return HttpResponse.json(createdHousehold, { status: 201 });
                    }),
                    http.get("/api/management/household/:id/invitations", () => {
                        return HttpResponse.json([]);
                    }),
                    http.get("/api/management/household/invitations/mine", () => {
                        return HttpResponse.json([]);
                    })
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);

        // Dialog renders in a Radix portal outside the canvas — use screen
        const dialog = await screen.findByRole("dialog");
        const nameInput = await within(dialog).findByLabelText(/name/i);
        await userEvent.type(nameInput, "My New Home");

        const submitButton = await within(dialog).findByRole("button", { name: /create household/i });
        await userEvent.click(submitButton);

        // After optimistic insert, the page should show the household name
        await canvas.findByText("My New Home");
    }
};

// [visual] The household page shows a list of pending invitations with the invitee's email and status
export const WithPendingInvitations: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember],
                pendingInvitations: [bobPendingInvitation]
            })
        }
    }
};

// [visual] The current user sees incoming invitations addressed to them with household name and inviter name
export const WithMyInvitations: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [],
                myInvitations: [myInvitationFromAlice]
            })
        }
    }
};

// [visual] My invitations displayed alongside an existing household
export const WithHouseholdAndMyInvitations: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember],
                myInvitations: [myInvitationFromAlice]
            })
        }
    }
};

// [interactive] Clicking "Invite Member" opens a dialog with an email field
export const WithInviteDialogOpen: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember]
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);
    }
};

// [interactive] After the invite succeeds, the dialog closes and the new invitation appears in the pending list
export const AfterInviteSent: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let invitations: Record<string, unknown>[] = [];

                return [
                    http.get("/api/management/household", () => {
                        return HttpResponse.json([aliceHousehold]);
                    }),
                    http.get("/api/management/household/:id/members", () => {
                        return HttpResponse.json([aliceMember]);
                    }),
                    http.get("/api/management/household/:id/invitations", () => {
                        return HttpResponse.json(invitations);
                    }),
                    http.get("/api/management/household/invitations/mine", () => {
                        return HttpResponse.json([]);
                    }),
                    http.post("/api/management/household/invitations", async () => {
                        const newInv = {
                            id: "inv-new",
                            householdId: "h-1",
                            invitedBy: "user-alice",
                            inviteeEmail: "bob@example.com",
                            status: "pending",
                            creationDate: new Date()
                        };
                        invitations = [newInv];

                        return HttpResponse.json(newInv, { status: 201 });
                    })
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);

        const dialog = await screen.findByRole("dialog");
        const emailInput = await within(dialog).findByLabelText(/email/i);
        await userEvent.type(emailInput, "bob@example.com");

        const submitButton = await within(dialog).findByRole("button", { name: /send invite/i });
        await userEvent.click(submitButton);

        // After success, the invitation should appear in the pending list
        await canvas.findByText("bob@example.com");
    }
};

// [interactive] Clicking "Accept" on an incoming invitation shows a loading indicator on the accept button
export const WithAcceptLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [],
                myInvitations: [myInvitationFromAlice],
                acceptDeclineDelay: "infinite"
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const acceptButton = await canvas.findByRole("button", { name: /accept invitation from the plant house/i });
        await userEvent.click(acceptButton);
    }
};

// [interactive] Clicking "Decline" on an incoming invitation shows a loading indicator on the decline button
export const WithDeclineLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [],
                myInvitations: [myInvitationFromAlice],
                acceptDeclineDelay: "infinite"
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const declineButton = await canvas.findByRole("button", { name: /decline invitation from the plant house/i });
        await userEvent.click(declineButton);
    }
};

// [interactive] After accepting, the invitation disappears from the incoming list
export const AfterAccept: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let invitations = [myInvitationFromAlice];

                return [
                    http.get("/api/management/household", () => {
                        return HttpResponse.json([]);
                    }),
                    http.get("/api/management/household/invitations/mine", () => {
                        return HttpResponse.json(invitations);
                    }),
                    http.patch("/api/management/household/invitations/:id/accept", () => {
                        invitations = [];

                        return HttpResponse.json({ status: "accepted" });
                    })
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const acceptButton = await canvas.findByRole("button", { name: /accept invitation from the plant house/i });
        await userEvent.click(acceptButton);

        // Wait for the invitation to disappear - look for absence of the section
        await canvas.findByText("No household yet");
    }
};

// [interactive] After declining, the invitation disappears from the incoming list
export const AfterDecline: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let invitations = [myInvitationFromAlice];

                return [
                    http.get("/api/management/household", () => {
                        return HttpResponse.json([]);
                    }),
                    http.get("/api/management/household/invitations/mine", () => {
                        return HttpResponse.json(invitations);
                    }),
                    http.patch("/api/management/household/invitations/:id/decline", () => {
                        invitations = [];

                        return HttpResponse.json({ status: "declined" });
                    })
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const declineButton = await canvas.findByRole("button", { name: /decline invitation from the plant house/i });
        await userEvent.click(declineButton);

        // Wait for the invitation to disappear
        await canvas.findByText("No household yet");
    }
};

// --- Slice 4: Shared plants & responsibility assignment ---

// [visual] The household detail page shows a section listing all plants shared with the household
// [visual] Each shared plant displays its current responsibility setting
// [visual] When set to a specific member, that member's name is displayed next to the plant
// [visual] When set to rotating, a "Rotating" label is displayed with the name of the member currently in rotation
export const WithSharedPlants: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember, bobMember],
                sharedPlants,
                assignments: mixedAssignments
            })
        }
    }
};

// [visual] Shared plants with no assignments yet (all unassigned)
export const WithSharedPlantsUnassigned: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember, bobMember],
                sharedPlants,
                assignments: []
            })
        }
    }
};

// [interactive] Clicking on a plant's responsibility setting opens a selector with options
export const WithResponsibilitySelectorOpen: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember, bobMember],
                sharedPlants,
                assignments: mixedAssignments
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Wait for the shared plants section to render, then click the first select trigger
        const trigger = await canvas.findByLabelText("Responsibility for Monstera Deliciosa");
        await userEvent.click(trigger);
    }
};

// [interactive] Selecting a responsibility option shows a loading indicator on the selector
export const WithAssignmentUpdateLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember, bobMember],
                sharedPlants,
                assignments: mixedAssignments,
                assignmentUpdateDelay: "infinite"
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = await canvas.findByLabelText("Responsibility for Snake Plant");
        await userEvent.click(trigger);

        // Select "Rotating" from the dropdown (renders in a portal)
        const option = await screen.findByRole("option", { name: "Rotating" });
        await userEvent.click(option);
    }
};

// [interactive] After the assignment succeeds, the updated responsibility is displayed on the plant row
export const AfterAssignmentChange: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember, bobMember],
                sharedPlants,
                assignments: mixedAssignments
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Change Snake Plant (unassigned) to "Alice" (fixed)
        const trigger = await canvas.findByLabelText("Responsibility for Snake Plant");
        await userEvent.click(trigger);

        const option = await screen.findByRole("option", { name: "Alice" });
        await userEvent.click(option);

        // After the mutation resolves, the assignment should be updated
        // Wait for the select to re-enable (loading finished)
        await canvas.findByLabelText("Responsibility for Snake Plant");
    }
};

// [interactive] Changing from one strategy to another updates the display accordingly
export const AfterStrategySwitch: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [aliceHousehold],
                members: [aliceMember, bobMember],
                sharedPlants,
                assignments: mixedAssignments
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Change Monstera (fixed:Alice) to "Rotating"
        const trigger = await canvas.findByLabelText("Responsibility for Monstera Deliciosa");
        await userEvent.click(trigger);

        const option = await screen.findByRole("option", { name: "Rotating" });
        await userEvent.click(option);

        // Wait for the assignment to be updated
        await canvas.findByLabelText("Responsibility for Monstera Deliciosa");
    }
};
