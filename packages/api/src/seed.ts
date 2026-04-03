import { careEventDb } from "./db/care-events/careEventDb.ts";
import { householdDb } from "./db/household/householdDb.ts";
import { plantsDb } from "./db/plants/plantsDb.ts";
import { defaultSeedPlants } from "./db/plants/seedData.ts";
import { assignmentDb } from "./db/responsibility/assignmentDb.ts";
import type { CareEvent } from "./entities/care-events/types.ts";
import type { ResponsibilityAssignment } from "./entities/responsibility/types.ts";

const defaultSeedHouseholds = [
    {
        id: "household-1",
        name: "Green Thumb House",
        createdBy: "user-alice",
        creationDate: new Date(2025, 0, 1)
    }
];

const defaultSeedMembers = [
    {
        id: "member-1",
        householdId: "household-1",
        userId: "user-alice",
        userName: "Alice",
        role: "owner" as const,
        joinDate: new Date(2025, 0, 1)
    },
    {
        id: "member-2",
        householdId: "household-1",
        userId: "user-bob",
        userName: "Bob",
        role: "member" as const,
        joinDate: new Date(2025, 0, 15)
    }
];

function generateDefaultAssignments(): ResponsibilityAssignment[] {
    const sharedPlants = defaultSeedPlants.filter(p => p.shared);
    const strategies: Array<"fixed" | "rotating" | "unassigned"> = ["fixed", "rotating", "unassigned"];
    const members = [
        { id: "member-1", name: "Alice" },
        { id: "member-2", name: "Bob" }
    ];

    return sharedPlants.map((plant, index) => {
        const strategy = strategies[index % strategies.length]!;
        const member = strategy === "fixed" ? members[index % members.length]! : undefined;

        return {
            id: `assignment-${index + 1}`,
            plantId: plant.id,
            householdId: "household-1",
            strategy,
            assignedMemberId: member?.id,
            assignedMemberName: member?.name
        };
    });
}

const defaultSeedAssignments = generateDefaultAssignments();

function generateDefaultCareEvents(): CareEvent[] {
    const sharedPlants = defaultSeedPlants.filter(p => p.shared);
    const events: CareEvent[] = [];
    const now = Date.now();

    for (let i = 0; i < Math.min(sharedPlants.length, 3); i++) {
        const plant = sharedPlants[i]!;
        // Event from Alice — 2 hours ago
        events.push({
            id: `care-event-${i * 2 + 1}`,
            plantId: plant.id,
            actorId: "user-alice",
            actorName: "Alice",
            eventType: "watered",
            timestamp: new Date(now - 2 * 60 * 60 * 1000)
        });
        // Event from Bob — 1 day ago
        events.push({
            id: `care-event-${i * 2 + 2}`,
            plantId: plant.id,
            actorId: "user-bob",
            actorName: "Bob",
            eventType: "watered",
            timestamp: new Date(now - 24 * 60 * 60 * 1000)
        });
    }

    return events;
}

const defaultSeedCareEvents = generateDefaultCareEvents();

export function seedDatabase() {
    plantsDb.reset(defaultSeedPlants);
    householdDb.reset(defaultSeedHouseholds, defaultSeedMembers);
    assignmentDb.reset(defaultSeedAssignments);
    careEventDb.reset(defaultSeedCareEvents);
}
