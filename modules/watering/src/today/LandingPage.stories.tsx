import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { createHouseholdHandlers } from "@packages/api/handlers/household";
import { createTodayPlantHandlers, createTodayAssignmentHandlers, createTodayCareEventHandlers } from "@packages/api/handlers/today";
import { makePlant, makeAssignment, makeCareEvent, FAR_PAST, FAR_FUTURE, makeHouseholdMember } from "@packages/api/test-utils";

import { LandingPage } from "./LandingPage.tsx";
import { queryDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Watering/Today/Pages/LandingPage",
    component: LandingPage,
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
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultMembers = [
    makeHouseholdMember({ id: "member-1", userId: "user-alice", userName: "Alice", role: "owner" }),
    makeHouseholdMember({ id: "member-2", userId: "user-bob", userName: "Bob" })
];

const householdHandlers = createHouseholdHandlers({
    household: { id: "household-1", name: "Green Thumb House", createdBy: "user-alice", creationDate: new Date(2025, 0, 1) },
    members: defaultMembers
});

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
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
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
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
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
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
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
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

export const Empty: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([]),
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers("loading"),
                ...createTodayAssignmentHandlers("loading"),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

// --- Assignment grouping stories ---

// Plants assigned to the current user (Alice)
export const MyAssignedPlants: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "mine-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "mine-2", name: "Boston Fern", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "private-1", name: "Cactus", shared: false, nextWateringDate: FAR_PAST })
                ]),
                ...createTodayAssignmentHandlers([
                    makeAssignment({ id: "a-1", plantId: "mine-1", strategy: "fixed", assignedMemberId: "member-1", assignedMemberName: "Alice" }),
                    makeAssignment({ id: "a-2", plantId: "mine-2", strategy: "fixed", assignedMemberId: "member-1", assignedMemberName: "Alice" })
                ]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

// Plants assigned to another member (Bob)
export const OthersAssignedPlants: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "other-1", name: "Dracaena", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "other-2", name: "English Ivy", shared: true, nextWateringDate: FAR_PAST })
                ]),
                ...createTodayAssignmentHandlers([
                    makeAssignment({ id: "a-3", plantId: "other-1", strategy: "fixed", assignedMemberId: "member-2", assignedMemberName: "Bob" }),
                    makeAssignment({ id: "a-4", plantId: "other-2", strategy: "fixed", assignedMemberId: "member-2", assignedMemberName: "Bob" })
                ]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

// Unassigned shared plants
export const UnassignedPlants: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "unassigned-1", name: "Fiddle Leaf Fig", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "unassigned-2", name: "Peace Lily", shared: true, nextWateringDate: FAR_PAST })
                ]),
                ...createTodayAssignmentHandlers([
                    makeAssignment({ id: "a-5", plantId: "unassigned-1", strategy: "unassigned" }),
                    makeAssignment({ id: "a-6", plantId: "unassigned-2", strategy: "unassigned" })
                ]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

// Mixed: mine, others', unassigned, and rotating
export const MixedAssignments: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "mine-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "other-1", name: "Boston Fern", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "unassigned-1", name: "Calathea", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "rotating-1", name: "Dracaena", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "private-1", name: "Echeveria", shared: false, nextWateringDate: FAR_PAST })
                ]),
                ...createTodayAssignmentHandlers([
                    makeAssignment({ id: "a-1", plantId: "mine-1", strategy: "fixed", assignedMemberId: "member-1", assignedMemberName: "Alice" }),
                    makeAssignment({ id: "a-2", plantId: "other-1", strategy: "fixed", assignedMemberId: "member-2", assignedMemberName: "Bob" }),
                    makeAssignment({ id: "a-3", plantId: "unassigned-1", strategy: "unassigned" }),
                    makeAssignment({ id: "a-4", plantId: "rotating-1", strategy: "rotating" })
                ]),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

// Loading state for assignments specifically
export const AssignmentsLoading: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST })]),
                ...createTodayAssignmentHandlers("loading"),
                ...createTodayCareEventHandlers([]),
                ...householdHandlers
            ]
        }
    }
};

// --- Conflict / already-watered stories ---

// Shared plant already watered today by Bob (another member) — shows dimmed with "Watered by Bob" badge
export const AlreadyWateredByOther: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "shared-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "shared-2", name: "Boston Fern", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "private-1", name: "Cactus", shared: false, nextWateringDate: FAR_PAST })
                ]),
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([
                    makeCareEvent({ id: "event-1", plantId: "shared-1", actorId: "user-bob", actorName: "Bob", timestamp: new Date() })
                ]),
                ...householdHandlers
            ]
        }
    }
};

// Mix of already-watered and not-watered shared plants
export const MixedWateringStatus: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([
                    makePlant({ id: "watered-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "not-watered-1", name: "Boston Fern", shared: true, nextWateringDate: FAR_PAST }),
                    makePlant({ id: "private-1", name: "Cactus", shared: false, nextWateringDate: FAR_PAST })
                ]),
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([
                    makeCareEvent({ id: "event-1", plantId: "watered-1", actorId: "user-bob", actorName: "Bob", timestamp: new Date() })
                ]),
                ...householdHandlers
            ]
        }
    }
};

// Shared plant watered by current user today — should NOT show "already watered" badge
export const WateredByCurrentUser: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([makePlant({ id: "shared-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST })]),
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([
                    makeCareEvent({ id: "event-1", plantId: "shared-1", actorId: "user-alice", actorName: "Alice", timestamp: new Date() })
                ]),
                ...householdHandlers
            ]
        }
    }
};

// --- Interactive conflict stories ---

const conflictCareEvent = makeCareEvent({ id: "conflict-1", plantId: "shared-1", actorId: "user-bob", actorName: "Bob", timestamp: new Date() });

// Play: click plant -> click "Mark as Watered" -> 409 triggers confirmation dialog
export const ConflictConfirmationPrompt: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([makePlant({ id: "shared-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST })], {
                    conflictEvent: conflictCareEvent
                }),
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([conflictCareEvent]),
                ...householdHandlers
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);
        // Click the plant row to open the detail dialog
        await userEvent.click(await canvas.findByRole("button", { name: /View Aloe Vera/i }));
        // Wait for the detail dialog to appear (portal renders outside canvas)
        const dialog = await body.findByRole("dialog");
        // Click "Mark as Watered" in the detail dialog
        const markBtn = within(dialog).getByRole("button", { name: /Mark as Watered/i });
        await userEvent.click(markBtn);
        // Wait for the confirmation alert dialog to appear
        await body.findByRole("alertdialog");
    }
};

// Play: conflict prompt shown with loading state while force-watering
export const ConflictForceWateringLoading: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createTodayPlantHandlers([makePlant({ id: "shared-1", name: "Aloe Vera", shared: true, nextWateringDate: FAR_PAST })], {
                    conflictEvent: conflictCareEvent,
                    putLoading: true
                }),
                ...createTodayAssignmentHandlers([]),
                ...createTodayCareEventHandlers([conflictCareEvent]),
                ...householdHandlers
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);
        // Click the plant row to open the detail dialog
        await userEvent.click(await canvas.findByRole("button", { name: /View Aloe Vera/i }));
        // Wait for the detail dialog to appear (portal renders outside canvas)
        const dialog = await body.findByRole("dialog");
        // Click "Mark as Watered" in the detail dialog
        const markBtn = within(dialog).getByRole("button", { name: /Mark as Watered/i });
        await userEvent.click(markBtn);
        // Wait for the confirmation alert dialog to appear
        const alertDialog = await body.findByRole("alertdialog");
        // Click "Water again" to trigger force watering (PUT will hang due to putLoading)
        const waterAgainBtn = within(alertDialog).getByRole("button", { name: /Water again/i });
        await userEvent.click(waterAgainBtn);
        // The button should now show "Watering..." and be disabled
        await within(alertDialog).findByRole("button", { name: /Watering/i });
    }
};
