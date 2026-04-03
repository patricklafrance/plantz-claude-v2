import type { Meta, StoryObj } from "@storybook/react-vite";

import { createHouseholdHandlers } from "@packages/api/handlers/household";
import { createTodayPlantHandlers, createTodayAssignmentHandlers, createTodayCareEventHandlers } from "@packages/api/handlers/today";
import { makePlant, makeAssignment, FAR_PAST, FAR_FUTURE, makeHouseholdMember } from "@packages/api/test-utils";

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
