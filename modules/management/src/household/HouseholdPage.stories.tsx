import type { Meta, StoryObj } from "@storybook/react-vite";
import { delay, http, HttpResponse } from "msw";
import { screen, userEvent, within } from "storybook/test";

import { makeHousehold, makeHouseholdMember, FIXED_HOUSEHOLD_DATE } from "@packages/core-plants/test-utils";

import { HouseholdPage } from "./HouseholdPage.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

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

// Empty state — no household exists
export const Empty: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([]) }
    }
};

// Household with owner only
export const WithHousehold: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([
                makeHousehold({
                    id: "h-1",
                    name: "The Green House",
                    createdBy: "user-alice",
                    createdAt: FIXED_HOUSEHOLD_DATE,
                    members: [makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" })]
                })
            ])
        }
    }
};

// Household with multiple members including active and invited
export const WithMultipleMembers: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([
                makeHousehold({
                    id: "h-2",
                    name: "Plant Family",
                    createdBy: "user-alice",
                    createdAt: FIXED_HOUSEHOLD_DATE,
                    members: [
                        makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" }),
                        makeHouseholdMember({ userId: "user-bob", userName: "Bob", email: "bob@example.com", role: "member" }),
                        makeHouseholdMember({
                            userId: "user-carol",
                            userName: "Carol",
                            email: "carol@example.com",
                            role: "member",
                            status: "invited"
                        })
                    ]
                })
            ])
        }
    }
};

// Household with a pending invite — shows the "Invited" badge distinction
export const WithPendingInvite: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([
                makeHousehold({
                    id: "h-3",
                    name: "Sunny Garden",
                    createdBy: "user-alice",
                    createdAt: FIXED_HOUSEHOLD_DATE,
                    members: [
                        makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" }),
                        makeHouseholdMember({
                            userId: "user-bob",
                            userName: "Bob",
                            email: "bob@example.com",
                            role: "member",
                            status: "invited"
                        })
                    ]
                })
            ])
        }
    }
};

// Loading state
export const Loading: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers("loading") }
    }
};

// Interactive: clicking "Create Household" opens dialog
export const CreateDialogOpen: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);
        await screen.findByRole("dialog");
    }
};

// Interactive: submit button shows loading state
export const CreateDialogSubmitting: Story = {
    parameters: {
        msw: {
            handlers: [
                http.post("/api/management/household", async () => {
                    await delay("infinite");

                    return HttpResponse.json({});
                }),
                ...createManagementHouseholdHandlers([])
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);
        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);
        await userEvent.type(dialogScope.getByLabelText(/name/i), "My Household");
        await userEvent.click(dialogScope.getByRole("button", { name: /create household/i }));
        // The submit button should now show "Creating..." text
        await screen.findByText("Creating...");
    }
};

// Interactive: after creation succeeds, dialog closes and household displays
export const AfterCreation: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let createdHousehold: Record<string, unknown> | null = null;

                return [
                    // GET returns created household after POST
                    http.get("/api/management/household", () => {
                        return HttpResponse.json(createdHousehold ? [createdHousehold] : []);
                    }),
                    // POST creates successfully and stores result
                    http.post("/api/management/household", async ({ request }) => {
                        const body = (await request.json()) as { name: string };

                        createdHousehold = {
                            id: "new-h-1",
                            name: body.name,
                            createdBy: "user-alice",
                            createdAt: new Date().toISOString(),
                            members: [
                                {
                                    userId: "user-alice",
                                    userName: "Alice",
                                    email: "alice@example.com",
                                    role: "owner",
                                    joinedAt: new Date().toISOString(),
                                    status: "active"
                                }
                            ]
                        };

                        return HttpResponse.json(createdHousehold, { status: 201 });
                    }),
                    // Stubs for member endpoints
                    http.post("/api/management/household/:id/members", () => HttpResponse.json({}, { status: 201 })),
                    http.put("/api/management/household/:id/members/:userId", () => HttpResponse.json({})),
                    http.delete("/api/management/household/:id/members/:userId", () => HttpResponse.json({}))
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);
        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);
        await userEvent.type(dialogScope.getByLabelText(/name/i), "My New Home");
        await userEvent.click(dialogScope.getByRole("button", { name: /create household/i }));
        // Wait for the household to appear after creation
        await canvas.findByText("My New Home");
    }
};

// Interactive: clicking "Invite Member" opens the invite dialog
export const InviteDialogOpen: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers([
                makeHousehold({
                    id: "h-invite-1",
                    name: "The Green House",
                    createdBy: "user-alice",
                    createdAt: FIXED_HOUSEHOLD_DATE,
                    members: [makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" })]
                })
            ])
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);
        await screen.findByRole("dialog");
    }
};

// Interactive: invite dialog submit shows loading state
export const InviteDialogSubmitting: Story = {
    parameters: {
        msw: {
            handlers: [
                http.post("/api/management/household/:id/members", async () => {
                    await delay("infinite");

                    return HttpResponse.json({});
                }),
                ...createManagementHouseholdHandlers([
                    makeHousehold({
                        id: "h-invite-2",
                        name: "The Green House",
                        createdBy: "user-alice",
                        createdAt: FIXED_HOUSEHOLD_DATE,
                        members: [makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" })]
                    })
                ])
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);
        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);
        await userEvent.type(dialogScope.getByLabelText(/email/i), "carol@example.com");
        await userEvent.click(dialogScope.getByRole("button", { name: /send invite/i }));
        await screen.findByText("Inviting...");
    }
};

// Interactive: after inviting, new member appears with invited status
export const AfterInvite: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let invited = false;

                const householdWithCarol = makeHousehold({
                    id: "h-invite-3",
                    name: "The Green House",
                    createdBy: "user-alice",
                    createdAt: FIXED_HOUSEHOLD_DATE,
                    members: [
                        makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" }),
                        makeHouseholdMember({
                            userId: "user-carol",
                            userName: "Carol",
                            email: "carol@example.com",
                            role: "member",
                            status: "invited"
                        })
                    ]
                });

                return [
                    // GET returns updated data after invite
                    http.get("/api/management/household", () => {
                        if (invited) {
                            return HttpResponse.json([householdWithCarol]);
                        }

                        return HttpResponse.json([
                            makeHousehold({
                                id: "h-invite-3",
                                name: "The Green House",
                                createdBy: "user-alice",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members: [makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" })]
                            })
                        ]);
                    }),
                    // POST invite succeeds and flips the flag
                    http.post("/api/management/household/:id/members", () => {
                        invited = true;

                        return HttpResponse.json(householdWithCarol, { status: 201 });
                    }),
                    http.post("/api/management/household", () => HttpResponse.json({}, { status: 201 })),
                    http.put("/api/management/household/:id/members/:userId", () => HttpResponse.json({})),
                    http.delete("/api/management/household/:id/members/:userId", () => HttpResponse.json({}))
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inviteButton = await canvas.findByRole("button", { name: /invite member/i });
        await userEvent.click(inviteButton);
        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);
        await userEvent.type(dialogScope.getByLabelText(/email/i), "carol@example.com");
        await userEvent.click(dialogScope.getByRole("button", { name: /send invite/i }));
        // Wait for Carol to appear in the member list
        await canvas.findByText("Carol");
    }
};

// Interactive: an invited user sees the pending invitation prompt and can accept
export const AcceptInvite: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let accepted = false;

                return [
                    // GET returns updated data after accept — Alice's status changes to active
                    http.get("/api/management/household", () => {
                        return HttpResponse.json([
                            makeHousehold({
                                id: "h-accept-1",
                                name: "Bob's Garden",
                                createdBy: "user-bob",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members: [
                                    makeHouseholdMember({ userId: "user-bob", userName: "Bob", email: "bob@example.com", role: "owner" }),
                                    makeHouseholdMember({
                                        userId: "user-alice",
                                        userName: "Alice",
                                        email: "alice@example.com",
                                        role: "member",
                                        status: accepted ? "active" : "invited"
                                    })
                                ]
                            })
                        ]);
                    }),
                    http.put("/api/management/household/:id/members/:userId", () => {
                        accepted = true;

                        return HttpResponse.json(
                            makeHousehold({
                                id: "h-accept-1",
                                name: "Bob's Garden",
                                createdBy: "user-bob",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members: [
                                    makeHouseholdMember({ userId: "user-bob", userName: "Bob", email: "bob@example.com", role: "owner" }),
                                    makeHouseholdMember({
                                        userId: "user-alice",
                                        userName: "Alice",
                                        email: "alice@example.com",
                                        role: "member",
                                        status: "active"
                                    })
                                ]
                            })
                        );
                    }),
                    http.post("/api/management/household", () => HttpResponse.json({}, { status: 201 })),
                    http.post("/api/management/household/:id/members", () => HttpResponse.json({}, { status: 201 })),
                    http.delete("/api/management/household/:id/members/:userId", () => HttpResponse.json({}))
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Wait for the pending invitation prompt
        const acceptButton = await canvas.findByRole("button", { name: /accept/i });
        await userEvent.click(acceptButton);
        // After accepting, the invitation prompt should disappear
        // and the member should now show as active (no "Invited" badge for alice)
        await canvas.findByText("Bob's Garden");
    }
};

// Interactive: an invited user can decline the invitation
export const DeclineInvite: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let declined = false;

                return [
                    // GET returns updated data after decline — Alice is removed from members
                    http.get("/api/management/household", () => {
                        const members = [
                            makeHouseholdMember({ userId: "user-bob", userName: "Bob", email: "bob@example.com", role: "owner" }),
                            ...(!declined
                                ? [
                                      makeHouseholdMember({
                                          userId: "user-alice",
                                          userName: "Alice",
                                          email: "alice@example.com",
                                          role: "member",
                                          status: "invited" as const
                                      })
                                  ]
                                : [])
                        ];

                        return HttpResponse.json([
                            makeHousehold({
                                id: "h-decline-1",
                                name: "Bob's Garden",
                                createdBy: "user-bob",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members
                            })
                        ]);
                    }),
                    http.delete("/api/management/household/:id/members/:userId", () => {
                        declined = true;

                        return HttpResponse.json(
                            makeHousehold({
                                id: "h-decline-1",
                                name: "Bob's Garden",
                                createdBy: "user-bob",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members: [makeHouseholdMember({ userId: "user-bob", userName: "Bob", email: "bob@example.com", role: "owner" })]
                            })
                        );
                    }),
                    http.post("/api/management/household", () => HttpResponse.json({}, { status: 201 })),
                    http.post("/api/management/household/:id/members", () => HttpResponse.json({}, { status: 201 })),
                    http.put("/api/management/household/:id/members/:userId", () => HttpResponse.json({}))
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const declineButton = await canvas.findByRole("button", { name: /decline/i });
        await userEvent.click(declineButton);
        // After declining, the household page should still show but without Alice as a member
        await canvas.findByText("Bob's Garden");
    }
};

// Interactive: owner can remove a member
export const RemoveMember: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let removed = false;

                return [
                    // GET returns updated data after remove — Bob is removed from members
                    http.get("/api/management/household", () => {
                        const members = [
                            makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" }),
                            ...(!removed
                                ? [makeHouseholdMember({ userId: "user-bob", userName: "Bob", email: "bob@example.com", role: "member" })]
                                : [])
                        ];

                        return HttpResponse.json([
                            makeHousehold({
                                id: "h-remove-1",
                                name: "The Green House",
                                createdBy: "user-alice",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members
                            })
                        ]);
                    }),
                    http.delete("/api/management/household/:id/members/:userId", () => {
                        removed = true;

                        return HttpResponse.json(
                            makeHousehold({
                                id: "h-remove-1",
                                name: "The Green House",
                                createdBy: "user-alice",
                                createdAt: FIXED_HOUSEHOLD_DATE,
                                members: [makeHouseholdMember({ userId: "user-alice", userName: "Alice", email: "alice@example.com", role: "owner" })]
                            })
                        );
                    }),
                    http.post("/api/management/household", () => HttpResponse.json({}, { status: 201 })),
                    http.post("/api/management/household/:id/members", () => HttpResponse.json({}, { status: 201 })),
                    http.put("/api/management/household/:id/members/:userId", () => HttpResponse.json({}))
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const removeButton = await canvas.findByRole("button", { name: /remove bob/i });
        await userEvent.click(removeButton);
        // After removing, Bob should no longer be in the list
        await canvas.findByText("The Green House");
    }
};
