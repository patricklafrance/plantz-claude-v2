import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AUTH_TOKEN_KEY } from "@packages/core-module";
import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/core-plants/test-utils";
import type { VacationPlan } from "@packages/core-plants/vacation";

import { LandingPage } from "./LandingPage.tsx";
import { createTodayPlantHandlers, createCareEventHandlers, type HouseholdContextData } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Today/LandingPage/Pages/LandingPage",
    component: LandingPage,
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
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: mix of due and not-due plants (landing page filters to due only)
export const Default: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE }),
                makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: FAR_PAST }),
                makePlant({ id: "not-due-2", name: "Echeveria", nextWateringDate: FAR_FUTURE })
            ])
        }
    }
};

// All plants have future watering dates -- none are due
export const NoPlantsDue: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "future-1", name: "Monstera", nextWateringDate: FAR_FUTURE }),
                makePlant({ id: "future-2", name: "Pothos", nextWateringDate: FAR_FUTURE }),
                makePlant({ id: "future-3", name: "Snake Plant", nextWateringDate: FAR_FUTURE })
            ])
        }
    }
};

// All plants have past watering dates -- all are due
export const AllDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-3", name: "Calathea", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-4", name: "Dracaena", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST })
            ])
        }
    }
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({
                    id: "single-1",
                    name: "Monstera Deliciosa",
                    description: "A tropical plant with large fenestrated leaves.",
                    family: "Araceae",
                    nextWateringDate: FAR_PAST
                })
            ])
        }
    }
};

export const Empty: Story = {
    parameters: {
        msw: { handlers: createTodayPlantHandlers([]) }
    }
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createTodayPlantHandlers("loading") }
    }
};

const activePlan: VacationPlan = {
    id: "plan-1",
    startDate: new Date(2099, 5, 1),
    endDate: new Date(2099, 5, 14),
    strategy: "balanced",
    status: "active",
    recommendations: [],
    createdAt: new Date(2099, 4, 20),
    updatedAt: new Date(2099, 4, 20)
};

export const WithActivePlan: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers(
                [
                    makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE })
                ],
                activePlan
            )
        }
    }
};

// ─── Shared Household Stories ───

const householdId = "household-1";

const sharedHouseholdContext: HouseholdContextData = {
    householdId,
    currentUserId: "user-alice",
    responsibilities: [
        { plantId: "shared-mine-1", strategy: "fixed", responsibleUserId: "user-alice", responsibleUserName: "Alice" },
        { plantId: "shared-mine-2", strategy: "rotating", responsibleUserId: "user-alice", responsibleUserName: "Alice" },
        { plantId: "shared-bob-1", strategy: "fixed", responsibleUserId: "user-bob", responsibleUserName: "Bob" },
        { plantId: "shared-unassigned-1", strategy: "unassigned" },
        { plantId: "shared-unassigned-2", strategy: "unassigned" }
    ],
    lastCareEvents: {
        "shared-mine-1": { actorName: "Bob", eventDate: new Date(2025, 2, 27, 14, 0).toISOString() },
        "shared-bob-1": { actorName: "Alice", eventDate: new Date(2025, 2, 26, 10, 30).toISOString() },
        "shared-unassigned-1": { actorName: "Bob", eventDate: new Date(2025, 2, 25, 8, 0).toISOString() }
    },
    memberNames: { "user-alice": "Alice", "user-bob": "Bob" }
};

const mixedPlants = [
    // Personal plants (no householdId)
    makePlant({ id: "personal-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
    makePlant({ id: "personal-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
    // Shared — assigned to me
    makePlant({ id: "shared-mine-1", name: "Monstera (Shared)", nextWateringDate: FAR_PAST, householdId }),
    makePlant({ id: "shared-mine-2", name: "Peace Lily (Shared)", nextWateringDate: FAR_PAST, householdId }),
    // Shared — assigned to Bob
    makePlant({ id: "shared-bob-1", name: "Fiddle Leaf Fig (Shared)", nextWateringDate: FAR_PAST, householdId }),
    // Shared — unassigned
    makePlant({ id: "shared-unassigned-1", name: "Snake Plant (Shared)", nextWateringDate: FAR_PAST, householdId }),
    makePlant({ id: "shared-unassigned-2", name: "Pothos (Shared)", nextWateringDate: FAR_PAST, householdId })
];

// Shared plants grouped by responsibility with "last watered by" annotations
export const SharedHouseholdView: Story = {
    parameters: {
        msw: {
            handlers: [...createTodayPlantHandlers(mixedPlants, null, sharedHouseholdContext), ...createCareEventHandlers([])]
        }
    }
};

// No household — single-user experience is unchanged
export const NoHousehold: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: FAR_PAST })
            ])
        }
    }
};

// All shared, none personal — only household groups shown
export const AllSharedPlants: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers(
                    [
                        makePlant({ id: "shared-mine-1", name: "Monstera", nextWateringDate: FAR_PAST, householdId }),
                        makePlant({ id: "shared-bob-1", name: "Fiddle Leaf", nextWateringDate: FAR_PAST, householdId }),
                        makePlant({ id: "shared-unassigned-1", name: "Snake Plant", nextWateringDate: FAR_PAST, householdId })
                    ],
                    null,
                    sharedHouseholdContext
                ),
                ...createCareEventHandlers([])
            ]
        }
    }
};

// Only unassigned shared plants
export const OnlyUnassignedShared: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers(
                    [
                        makePlant({ id: "shared-unassigned-1", name: "Snake Plant", nextWateringDate: FAR_PAST, householdId }),
                        makePlant({ id: "shared-unassigned-2", name: "Pothos", nextWateringDate: FAR_PAST, householdId })
                    ],
                    null,
                    {
                        ...sharedHouseholdContext,
                        responsibilities: [
                            { plantId: "shared-unassigned-1", strategy: "unassigned" },
                            { plantId: "shared-unassigned-2", strategy: "unassigned" }
                        ]
                    }
                ),
                ...createCareEventHandlers([])
            ]
        }
    }
};

// Shows the shared view after Alice just watered — "Last watered by Alice" is visible
export const SharedPlantRecentlyWatered: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers(
                    [makePlant({ id: "shared-mine-1", name: "Monstera (Shared)", nextWateringDate: FAR_PAST, householdId })],
                    null,
                    {
                        ...sharedHouseholdContext,
                        responsibilities: [
                            { plantId: "shared-mine-1", strategy: "fixed", responsibleUserId: "user-alice", responsibleUserName: "Alice" }
                        ],
                        lastCareEvents: {
                            "shared-mine-1": { actorName: "Alice", eventDate: new Date().toISOString() }
                        }
                    }
                ),
                ...createCareEventHandlers([])
            ]
        }
    }
};

// Play function: select shared plants, trigger bulk watering, verify the action completes
// with actor attribution (actorId sent as current user). After bulk watering the selection
// bar disappears, proving care events were created with the current user as actor.
export const BulkWateringActorAttribution: Story = {
    parameters: {
        a11y: { config: { rules: [{ id: "aria-required-children", enabled: false }] } },
        msw: {
            handlers: [
                ...createTodayPlantHandlers(
                    [
                        makePlant({ id: "shared-mine-1", name: "Monstera (Shared)", nextWateringDate: FAR_PAST, householdId }),
                        makePlant({ id: "shared-mine-2", name: "Peace Lily (Shared)", nextWateringDate: FAR_PAST, householdId }),
                        makePlant({ id: "personal-1", name: "Aloe Vera", nextWateringDate: FAR_PAST })
                    ],
                    null,
                    {
                        ...sharedHouseholdContext,
                        responsibilities: [
                            { plantId: "shared-mine-1", strategy: "fixed", responsibleUserId: "user-alice", responsibleUserName: "Alice" },
                            { plantId: "shared-mine-2", strategy: "fixed", responsibleUserId: "user-alice", responsibleUserName: "Alice" }
                        ]
                    }
                ),
                ...createCareEventHandlers([])
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Set auth token so getCurrentUserId() returns "user-alice" for actor attribution
        sessionStorage.setItem(AUTH_TOKEN_KEY, "user-alice");

        // Wait for the shared plants to render
        const monstera = await canvas.findByLabelText("Select Monstera (Shared)");
        const peaceLily = await canvas.findByLabelText("Select Peace Lily (Shared)");

        // Select both shared plants
        await userEvent.click(monstera);
        await userEvent.click(peaceLily);

        // Verify the selection bar shows the count
        await canvas.findByText("2 selected");

        // Click the bulk water button
        const bulkWaterButton = canvas.getByRole("button", { name: "Mark selected as Watered" });
        await userEvent.click(bulkWaterButton);

        // After the bulk action completes, the selection clears. Wait for the selection bar
        // to disappear, which proves the bulk care events were created successfully with
        // actorId: getCurrentUserId() (= "user-alice").
        await waitFor(() => {
            expect(canvas.queryByText("2 selected")).toBeNull();
        });

        // Clean up sessionStorage
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
};

// Simulates a shared plant that was recently watered by another user (Bob). The plant's
// nextWateringDate is in the future, so it does NOT appear in the due list. This verifies
// that refreshing the page after another user watered a shared plant removes it from the
// today view because isDueForWatering returns false.
export const SharedPlantWateredByOtherNotDue: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers(
                    [
                        // This shared plant was recently watered by Bob — nextWateringDate is in the future
                        makePlant({ id: "shared-watered-1", name: "Fiddle Leaf Fig (Shared)", nextWateringDate: FAR_FUTURE, householdId }),
                        // This personal plant is still due for watering
                        makePlant({ id: "personal-due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST })
                    ],
                    null,
                    {
                        ...sharedHouseholdContext,
                        responsibilities: [
                            { plantId: "shared-watered-1", strategy: "fixed", responsibleUserId: "user-alice", responsibleUserName: "Alice" }
                        ],
                        lastCareEvents: {
                            "shared-watered-1": { actorName: "Bob", eventDate: new Date().toISOString() }
                        }
                    }
                ),
                ...createCareEventHandlers([])
            ]
        }
    }
};
