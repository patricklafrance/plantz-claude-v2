import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import type { CareEvent } from "@packages/api/entities/care-events";
import type { HouseholdMember } from "@packages/api/entities/household";
import type { ResponsibilityAssignment } from "@packages/api/entities/responsibility";
import { makePlant, FAR_PAST, FIXED_CREATION } from "@packages/api/test-utils";

import { PlantDetailDialog } from "./PlantDetailDialog.tsx";

const defaultPlant = {
    id: "test-1" as const,
    name: "Monstera Deliciosa" as const,
    description: "A tropical plant with large fenestrated leaves.",
    family: "Araceae",
    soilType: "Well-draining mix",
    nextWateringDate: FAR_PAST
};

const defaultMembers: HouseholdMember[] = [
    { id: "member-1", householdId: "household-1", userId: "user-alice", userName: "Alice", role: "owner", joinDate: FIXED_CREATION },
    { id: "member-2", householdId: "household-1", userId: "user-bob", userName: "Bob", role: "member", joinDate: FIXED_CREATION }
];

const fixedAssignment: ResponsibilityAssignment = {
    id: "assignment-1",
    plantId: "test-1",
    householdId: "household-1",
    strategy: "fixed",
    assignedMemberId: "member-1",
    assignedMemberName: "Alice"
};

const unassignedAssignment: ResponsibilityAssignment = {
    id: "assignment-2",
    plantId: "test-1",
    householdId: "household-1",
    strategy: "unassigned"
};

const rotatingAssignment: ResponsibilityAssignment = {
    id: "assignment-3",
    plantId: "test-1",
    householdId: "household-1",
    strategy: "rotating"
};

const meta = {
    title: "Watering/Today/Components/PlantDetailDialog",
    component: PlantDetailDialog,
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
    },
    args: {
        open: true,
        onOpenChange: () => {}
    }
} satisfies Meta<typeof PlantDetailDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        plant: makePlant({ ...defaultPlant })
    }
};

export const MinimalFields: Story = {
    args: {
        plant: makePlant({
            ...defaultPlant,
            description: undefined,
            family: undefined,
            soilType: undefined
        })
    }
};

export const LongValues: Story = {
    args: {
        plant: makePlant({
            ...defaultPlant,
            name: "Philodendron Birkin Variegated Extra Special Limited Edition",
            description:
                "A rare variegated cultivar of the Philodendron Birkin with stunning white pinstripe patterns on dark green leaves. Requires consistent humidity and indirect light.",
            wateringQuantity: "500ml every other day when soil is dry"
        })
    }
};

export const WithMarkWatered: Story = {
    args: {
        plant: makePlant({ ...defaultPlant }),
        onMarkWatered: () => {}
    }
};

// --- Responsibility section stories (shared plants only) ---

export const SharedWithFixedAssignment: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        isSavingAssignment: false,
        onAssignmentChange: () => {}
    }
};

export const SharedWithRotatingAssignment: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: rotatingAssignment,
        members: defaultMembers,
        isSavingAssignment: false,
        onAssignmentChange: () => {}
    }
};

export const SharedUnassigned: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: unassignedAssignment,
        members: defaultMembers,
        isSavingAssignment: false,
        onAssignmentChange: () => {}
    }
};

export const SharedNoAssignment: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: undefined,
        members: defaultMembers,
        isSavingAssignment: false,
        onAssignmentChange: () => {}
    }
};

export const NonSharedPlant: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: false }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {}
    }
};

export const AssignmentSaving: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        isSavingAssignment: true,
        onAssignmentChange: () => {}
    }
};

export const SharedWithStrategyOpen: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        isSavingAssignment: false,
        onAssignmentChange: () => {}
    },
    play: async () => {
        // Portal-based Dialog renders outside canvas — use within(document.body)
        const body = within(document.body);
        await body.findByText("Responsibility");
        const trigger = body.getByLabelText("Responsibility strategy");
        await userEvent.click(trigger);
    }
};

// --- Care activity stories (shared plants only) ---

const singleCareEvent: CareEvent[] = [
    { id: "event-1", plantId: "test-1", actorId: "user-alice", actorName: "Alice", eventType: "watered", timestamp: new Date(2025, 2, 15, 10, 0, 0) }
];

const multipleEventsOneActor: CareEvent[] = [
    { id: "event-1", plantId: "test-1", actorId: "user-alice", actorName: "Alice", eventType: "watered", timestamp: new Date(2025, 2, 15, 10, 0, 0) },
    { id: "event-2", plantId: "test-1", actorId: "user-alice", actorName: "Alice", eventType: "watered", timestamp: new Date(2025, 2, 14, 8, 0, 0) }
];

const multipleEventsDifferentActors: CareEvent[] = [
    { id: "event-1", plantId: "test-1", actorId: "user-alice", actorName: "Alice", eventType: "watered", timestamp: new Date(2025, 2, 15, 10, 0, 0) },
    { id: "event-2", plantId: "test-1", actorId: "user-bob", actorName: "Bob", eventType: "watered", timestamp: new Date(2025, 2, 14, 8, 0, 0) },
    { id: "event-3", plantId: "test-1", actorId: "user-alice", actorName: "Alice", eventType: "watered", timestamp: new Date(2025, 2, 13, 14, 30, 0) }
];

export const SharedNoCareEvents: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        careEvents: []
    }
};

export const SharedSingleCareEvent: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        careEvents: singleCareEvent
    }
};

export const SharedMultipleEventsOneActor: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        careEvents: multipleEventsOneActor
    }
};

export const SharedMultipleEventsDifferentActors: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        careEvents: multipleEventsDifferentActors
    }
};

export const NonSharedNoCareEvents: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: false }),
        careEvents: multipleEventsDifferentActors
    }
};

// --- Already-watered / conflict stories ---

const todayCareEventByBob: CareEvent[] = [
    { id: "event-today-1", plantId: "test-1", actorId: "user-bob", actorName: "Bob", eventType: "watered", timestamp: new Date() }
];

const todayCareEventByAlice: CareEvent[] = [
    { id: "event-today-2", plantId: "test-1", actorId: "user-alice", actorName: "Alice", eventType: "watered", timestamp: new Date() }
];

export const AlreadyWateredByOther: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        onMarkWatered: () => {},
        careEvents: todayCareEventByBob,
        currentUserId: "user-alice"
    }
};

export const AlreadyWateredByCurrentUser: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        onMarkWatered: () => {},
        careEvents: todayCareEventByAlice,
        currentUserId: "user-alice"
    }
};

export const NotWateredTodayShared: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        onMarkWatered: () => {},
        careEvents: [],
        currentUserId: "user-alice"
    }
};

export const ReWaterConfirmation: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        onMarkWatered: () => {},
        careEvents: todayCareEventByBob,
        currentUserId: "user-alice",
        conflictEvent: todayCareEventByBob[0],
        onForceWater: () => {},
        onDismissConflict: () => {},
        isForceWateringPending: false
    }
};

export const ReWaterConfirmationPending: Story = {
    args: {
        plant: makePlant({ ...defaultPlant, shared: true }),
        assignment: fixedAssignment,
        members: defaultMembers,
        onAssignmentChange: () => {},
        onMarkWatered: () => {},
        careEvents: todayCareEventByBob,
        currentUserId: "user-alice",
        conflictEvent: todayCareEventByBob[0],
        onForceWater: () => {},
        onDismissConflict: () => {},
        isForceWateringPending: true
    }
};
