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

// Household with multiple members
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
                ...createManagementHouseholdHandlers([]),
                http.post("/api/management/household", async () => {
                    await delay("infinite");

                    return HttpResponse.json({});
                })
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
            handlers: [
                // Initial fetch returns empty
                http.get("/api/management/household", () => {
                    return HttpResponse.json([]);
                }),
                // POST creates successfully
                http.post("/api/management/household", async ({ request }) => {
                    const body = (await request.json()) as { name: string };

                    return HttpResponse.json(
                        {
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
                        },
                        { status: 201 }
                    );
                })
            ]
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
