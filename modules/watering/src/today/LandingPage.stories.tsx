import type { Meta, StoryObj } from "@storybook/react-vite";
import { screen, userEvent, within } from "storybook/test";

import { makePlant, FAR_PAST, FAR_FUTURE, makeHousehold, makeHouseholdMember } from "@packages/core-plants/test-utils";

import type { VacationPlan } from "../vacation-planner/vacationTypes.ts";
import { LandingPage } from "./LandingPage.tsx";
import { createTodayPlantHandlers, createTodayHouseholdHandler, createAssignmentHandlers, createCareEventHandlers } from "./mocks/index.ts";
import type { ResponsibilityAssignment } from "./responsibilityTypes.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Watering/Today/Pages/LandingPage",
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
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE }),
                    makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "not-due-2", name: "Echeveria", nextWateringDate: FAR_FUTURE })
                ]),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    }
};

// All plants have future watering dates -- none are due
export const NoPlantsDue: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "future-1", name: "Monstera", nextWateringDate: FAR_FUTURE }),
                    makePlant({ id: "future-2", name: "Pothos", nextWateringDate: FAR_FUTURE }),
                    makePlant({ id: "future-3", name: "Snake Plant", nextWateringDate: FAR_FUTURE })
                ]),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    }
};

// All plants have past watering dates -- all are due
export const AllDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-3", name: "Calathea", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-4", name: "Dracaena", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST })
                ]),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    }
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({
                        id: "single-1",
                        name: "Monstera Deliciosa",
                        description: "A tropical plant with large fenestrated leaves.",
                        family: "Araceae",
                        nextWateringDate: FAR_PAST
                    })
                ]),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    }
};

export const Empty: Story = {
    parameters: {
        msw: {
            handlers: [...createTodayPlantHandlers([]), ...createAssignmentHandlers({ assignments: [] })]
        }
    }
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: [...createTodayPlantHandlers("loading"), ...createAssignmentHandlers({ assignments: [] })]
        }
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

// Some plants are shared with a household — the Users icon indicator should appear
export const WithSharedPlants: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                    makePlant({ id: "due-shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" }),
                    makePlant({ id: "due-shared-2", name: "Shared Cactus", nextWateringDate: FAR_PAST, householdId: "household-1" }),
                    makePlant({ id: "not-due-1", name: "Private Pothos", nextWateringDate: FAR_FUTURE }),
                    makePlant({ id: "not-due-shared-1", name: "Shared Monstera", nextWateringDate: FAR_FUTURE, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    }
};

export const WithActivePlan: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers(
                    [
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE })
                    ],
                    activePlan
                ),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    }
};

// --- Responsibility grouping stories ---

const household = makeHousehold({
    id: "household-1",
    name: "Plant House",
    members: [
        makeHouseholdMember({ userId: "user-alice", userName: "Alice", role: "owner" }),
        makeHouseholdMember({ userId: "user-bob", userName: "Bob" }),
        makeHouseholdMember({ userId: "user-carol", userName: "Carol" })
    ]
});

const sharedDuePlants = [
    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" }),
    makePlant({ id: "shared-2", name: "Shared Orchid", nextWateringDate: FAR_PAST, householdId: "household-1" }),
    makePlant({ id: "shared-3", name: "Shared Cactus", nextWateringDate: FAR_PAST, householdId: "household-1" }),
    makePlant({ id: "shared-4", name: "Shared Lily", nextWateringDate: FAR_PAST, householdId: "household-1" }),
    makePlant({ id: "private-1", name: "My Aloe", nextWateringDate: FAR_PAST }),
    makePlant({ id: "private-2", name: "My Pothos", nextWateringDate: FAR_PAST })
];

const mixedAssignments: ResponsibilityAssignment[] = [
    { id: "a-1", plantId: "shared-1", strategy: "fixed", assignedUserId: "user-alice", assignedUserName: "Alice" },
    { id: "a-2", plantId: "shared-2", strategy: "fixed", assignedUserId: "user-bob", assignedUserName: "Bob" },
    { id: "a-3", plantId: "shared-3", strategy: "rotating" },
    { id: "a-4", plantId: "shared-4", strategy: "unassigned" }
];

// Mixed responsibility: my tasks, others' tasks, unassigned, and private plants
export const WithResponsibilityGrouping: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers(sharedDuePlants),
                ...createAssignmentHandlers({ assignments: mixedAssignments })
            ]
        }
    }
};

// All shared plants assigned to current user
export const AllMyTasks: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" }),
                    makePlant({ id: "shared-2", name: "Shared Orchid", nextWateringDate: FAR_PAST, householdId: "household-1" }),
                    makePlant({ id: "private-1", name: "My Aloe", nextWateringDate: FAR_PAST })
                ]),
                ...createAssignmentHandlers({
                    assignments: [
                        { id: "a-1", plantId: "shared-1", strategy: "fixed", assignedUserId: "user-alice", assignedUserName: "Alice" },
                        { id: "a-2", plantId: "shared-2", strategy: "fixed", assignedUserId: "user-alice", assignedUserName: "Alice" }
                    ]
                })
            ]
        }
    }
};

// All shared plants assigned to others
export const AllOthersTasks: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" }),
                    makePlant({ id: "shared-2", name: "Shared Orchid", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({
                    assignments: [
                        { id: "a-1", plantId: "shared-1", strategy: "fixed", assignedUserId: "user-bob", assignedUserName: "Bob" },
                        { id: "a-2", plantId: "shared-2", strategy: "fixed", assignedUserId: "user-carol", assignedUserName: "Carol" }
                    ]
                })
            ]
        }
    }
};

// All shared plants unassigned
export const AllUnassigned: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" }),
                    makePlant({ id: "shared-2", name: "Shared Orchid", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({
                    assignments: [
                        { id: "a-1", plantId: "shared-1", strategy: "unassigned" },
                        { id: "a-2", plantId: "shared-2", strategy: "unassigned" }
                    ]
                })
            ]
        }
    }
};

// [interactive] Clicking "Assign" opens the dialog
export const AssignDialogOpen: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({ assignments: [] })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Wait for the assign button to appear
        const assignButton = await canvas.findByRole("button", { name: /assign/i });
        await userEvent.click(assignButton);

        // Dialog renders via portal
        await screen.findByRole("dialog");
    }
};

// [interactive] Submitting assignment shows loading state
export const AssignSavingState: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                // POST handler will hang forever to show loading
                ...createAssignmentHandlers("loading")
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Open the assign dialog
        const assignButton = await canvas.findByRole("button", { name: /assign/i });
        await userEvent.click(assignButton);

        // Wait for dialog
        await screen.findByRole("dialog");
        const dialog = screen.getByRole("dialog");
        const dialogScope = within(dialog);

        // Click Save (unassigned is default)
        const saveButton = dialogScope.getByRole("button", { name: /save/i });
        await userEvent.click(saveButton);

        // Should show loading state
        await screen.findByText("Saving...");
    }
};

// --- Activity visibility and duplicate prevention stories ---

import { makeCareEvent } from "@packages/core-plants/test-utils";

const recentActivityPlants = [
    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" }),
    makePlant({ id: "shared-2", name: "Shared Orchid", nextWateringDate: FAR_PAST, householdId: "household-1" }),
    makePlant({ id: "private-1", name: "My Aloe", nextWateringDate: FAR_PAST })
];

const recentCareEvents = [
    makeCareEvent({
        id: "recent-1",
        plantId: "shared-1",
        eventDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        eventType: "watered",
        actorId: "user-bob",
        actorName: "Alex"
    }),
    makeCareEvent({
        id: "recent-2",
        plantId: "shared-2",
        eventDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
        eventType: "watered",
        actorId: "user-carol",
        actorName: "Carol"
    })
];

// [visual] Shared plants in the today view with recent care events from other household members.
// The activity summary ("Watered by Alex 2 hours ago") displays inside the PlantDetailDialog's
// PlantCareSection when a shared plant is opened. See PlantCareSection.stories > WithRecentActivityByOther
// for the isolated component story proving the summary renders.
export const WithRecentActivitySummary: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers(recentActivityPlants),
                ...createAssignmentHandlers({
                    assignments: [
                        { id: "a-1", plantId: "shared-1", strategy: "fixed", assignedUserId: "user-alice", assignedUserName: "Alice" },
                        { id: "a-2", plantId: "shared-2", strategy: "fixed", assignedUserId: "user-carol", assignedUserName: "Carol" }
                    ]
                }),
                ...createCareEventHandlers(recentCareEvents)
            ]
        }
    }
};

// [interactive] Duplicate watering -- clicking Mark as Watered on a recently watered shared plant shows warning
export const DuplicateWateringWarning: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({ assignments: [] }),
                ...createCareEventHandlers(recentCareEvents, {
                    postMode: "conflict",
                    conflict: { actorName: "Alex", eventDate: new Date(Date.now() - 2 * 60 * 60 * 1000) }
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Click on the shared plant to open detail dialog
        const plantButton = await canvas.findByRole("button", { name: /view shared fern/i });
        await userEvent.click(plantButton);

        // Wait for the detail dialog (portal)
        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);

        // Click Mark as Watered
        const waterButton = dialogScope.getByRole("button", { name: /mark as watered/i });
        await userEvent.click(waterButton);

        // Wait for the duplicate warning AlertDialog to appear (portal)
        await screen.findByRole("alertdialog");
    }
};

// [interactive] Duplicate watering loading state -- Mark as Watered shows loading spinner while checking
export const DuplicateWateringLoading: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({ assignments: [] }),
                ...createCareEventHandlers([], { postMode: "loading" })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Click on the shared plant to open detail dialog
        const plantButton = await canvas.findByRole("button", { name: /view shared fern/i });
        await userEvent.click(plantButton);

        // Wait for the detail dialog (portal)
        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);

        // Click Mark as Watered to trigger loading state
        const waterButton = dialogScope.getByRole("button", { name: /mark as watered/i });
        await userEvent.click(waterButton);

        // Wait for loading state
        await screen.findByText("Marking...");
    }
};

// [interactive] Confirming force-watering after duplicate warning
export const DuplicateWateringConfirmed: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({ assignments: [] }),
                ...createCareEventHandlers(recentCareEvents, {
                    postMode: "conflict",
                    conflict: { actorName: "Alex", eventDate: new Date(Date.now() - 2 * 60 * 60 * 1000) }
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Open the detail dialog
        const plantButton = await canvas.findByRole("button", { name: /view shared fern/i });
        await userEvent.click(plantButton);

        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);

        // Click Mark as Watered to trigger conflict
        const waterButton = dialogScope.getByRole("button", { name: /mark as watered/i });
        await userEvent.click(waterButton);

        // Wait for the duplicate warning AlertDialog (portal)
        await screen.findByRole("alertdialog");

        // Click "Water anyway" to force-water
        const forceButton = await screen.findByRole("button", { name: /water anyway/i });
        await userEvent.click(forceButton);
    }
};

// [interactive] Dismissing the duplicate warning cancels the action
export const DuplicateWateringDismissed: Story = {
    parameters: {
        msw: {
            handlers: [
                createTodayHouseholdHandler(household),
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Shared Fern", nextWateringDate: FAR_PAST, householdId: "household-1" })
                ]),
                ...createAssignmentHandlers({ assignments: [] }),
                ...createCareEventHandlers(recentCareEvents, {
                    postMode: "conflict",
                    conflict: { actorName: "Alex", eventDate: new Date(Date.now() - 2 * 60 * 60 * 1000) }
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Open the detail dialog
        const plantButton = await canvas.findByRole("button", { name: /view shared fern/i });
        await userEvent.click(plantButton);

        const dialog = await screen.findByRole("dialog");
        const dialogScope = within(dialog);

        // Click Mark as Watered to trigger conflict
        const waterButton = dialogScope.getByRole("button", { name: /mark as watered/i });
        await userEvent.click(waterButton);

        // Wait for the duplicate warning AlertDialog (portal)
        await screen.findByRole("alertdialog");

        // Click Cancel to dismiss
        const cancelButton = await screen.findByRole("button", { name: /cancel/i });
        await userEvent.click(cancelButton);
    }
};
