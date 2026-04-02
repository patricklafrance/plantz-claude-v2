import { householdDb } from "./db/household/householdDb.ts";
import { plantsDb } from "./db/plants/plantsDb.ts";
import { defaultSeedPlants } from "./db/plants/seedData.ts";

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

export function seedDatabase() {
    plantsDb.reset(defaultSeedPlants);
    householdDb.reset(defaultSeedHouseholds, defaultSeedMembers);
}
