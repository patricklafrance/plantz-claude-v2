import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { screen, userEvent, within } from "storybook/test";

import { makeHousehold } from "@packages/core-household/test-utils";

import { HouseholdPage } from "./HouseholdPage.tsx";
import { createManagementHouseholdHandlers, type StoryMember } from "./mocks/createHandlers.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const aliceHousehold = makeHousehold({ id: "h-1", name: "The Plant House" });

const aliceMember: StoryMember = {
    id: "m-1",
    householdId: "h-1",
    userId: "user-alice",
    userName: "Alice",
    joinedDate: new Date(2025, 0, 1)
};

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
