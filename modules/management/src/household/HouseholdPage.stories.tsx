import type { Meta, StoryObj } from "@storybook/react-vite";
import { delay, http, HttpResponse } from "msw";
import { userEvent, within } from "storybook/test";

import { createHouseholdHandlers, type HouseholdData } from "@packages/api/handlers/household";
import { makeHousehold, makeHouseholdMember } from "@packages/api/test-utils";

import { HouseholdPage } from "./HouseholdPage.tsx";
import { queryDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const defaultHousehold = makeHousehold({ id: "household-1", name: "Green Thumb House" });

const defaultMembers = [
    makeHouseholdMember({ id: "member-1", userId: "user-alice", userName: "Alice", role: "owner" }),
    makeHouseholdMember({ id: "member-2", userId: "user-bob", userName: "Bob", role: "member" })
];

const defaultData: HouseholdData = {
    household: defaultHousehold,
    members: defaultMembers
};

const meta = {
    title: "Management/Household/Pages/HouseholdPage",
    component: HouseholdPage,
    decorators: [queryDecorator, fireflyDecorator],
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

export const Default: Story = {
    parameters: {
        msw: { handlers: createHouseholdHandlers(defaultData) }
    }
};

export const NoHousehold: Story = {
    parameters: {
        msw: { handlers: createHouseholdHandlers({ household: null, members: [] }) }
    }
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createHouseholdHandlers("loading") }
    }
};

export const Error: Story = {
    parameters: {
        msw: { handlers: createHouseholdHandlers("error") }
    }
};

export const SingleMember: Story = {
    parameters: {
        msw: {
            handlers: createHouseholdHandlers({
                household: defaultHousehold,
                members: [makeHouseholdMember({ id: "member-1", userId: "user-alice", userName: "Alice", role: "owner" })]
            })
        }
    }
};

export const CreateHouseholdSuccess: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let createdHousehold: Record<string, unknown> | null = null;
                let createdMembers: Record<string, unknown>[] = [];

                return [
                    http.get("/api/household", () => HttpResponse.json(createdHousehold)),
                    http.get("/api/household/members", () => HttpResponse.json(createdMembers)),
                    http.post("/api/household", async ({ request }) => {
                        const body = (await request.json()) as { name: string };
                        createdHousehold = {
                            id: "new-household",
                            name: body.name,
                            createdBy: "user-alice",
                            creationDate: new Date(2025, 0, 1).toISOString()
                        };
                        createdMembers = [
                            {
                                id: "member-owner",
                                householdId: "new-household",
                                userId: "user-alice",
                                userName: "Alice",
                                role: "owner",
                                joinDate: new Date(2025, 0, 1).toISOString()
                            }
                        ];

                        return HttpResponse.json(createdHousehold, { status: 201 });
                    })
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const nameInput = await canvas.findByLabelText("Household name");
        await userEvent.type(nameInput, "My New Household");
        await userEvent.click(canvas.getByRole("button", { name: /create household/i }));
        await canvas.findByText("My New Household");
        await canvas.findByText("Alice");
    }
};

export const CreateHouseholdLoading: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/household", () => HttpResponse.json(null)),
                http.get("/api/household/members", () => HttpResponse.json([])),
                http.post("/api/household", async () => {
                    await delay("infinite");

                    return HttpResponse.json({}, { status: 201 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const nameInput = await canvas.findByLabelText("Household name");
        await userEvent.type(nameInput, "My New Household");
        await userEvent.click(canvas.getByRole("button", { name: /create household/i }));
        await canvas.findByRole("button", { name: /creating/i });
    }
};

export const InviteMemberSuccess: Story = {
    parameters: {
        msw: {
            handlers: (() => {
                let members: Record<string, unknown>[] = defaultMembers.map(m => ({ ...m }));

                return [
                    http.get("/api/household", () => HttpResponse.json(defaultHousehold)),
                    http.get("/api/household/members", () => HttpResponse.json(members)),
                    http.post("/api/household/invite", async ({ request }) => {
                        const body = (await request.json()) as { email: string };
                        const newMember = {
                            id: "member-3",
                            householdId: "household-1",
                            userId: "user-charlie",
                            userName: body.email.split("@")[0] ?? "Charlie",
                            role: "member" as const,
                            joinDate: new Date(2025, 2, 1).toISOString()
                        };
                        members = [...members, newMember];

                        return HttpResponse.json(newMember, { status: 201 });
                    })
                ];
            })()
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const emailInput = await canvas.findByLabelText("Invite member");
        await userEvent.type(emailInput, "charlie@example.com");
        await userEvent.click(canvas.getByRole("button", { name: /invite/i }));
        await canvas.findByText("charlie");
    }
};

export const InviteMemberLoading: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/household", () => HttpResponse.json(defaultHousehold)),
                http.get("/api/household/members", () => HttpResponse.json(defaultMembers)),
                http.post("/api/household/invite", async () => {
                    await delay("infinite");

                    return HttpResponse.json({}, { status: 201 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const emailInput = await canvas.findByLabelText("Invite member");
        await userEvent.type(emailInput, "charlie@example.com");
        await userEvent.click(canvas.getByRole("button", { name: /invite/i }));
        await canvas.findByRole("button", { name: /inviting/i });
    }
};
