import type { HouseholdMember } from "../householdMemberSchema.ts";
import type { Household } from "../householdSchema.ts";

function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function generateHouseholds(userId: string): { household: Household; members: HouseholdMember[] } {
    const householdId = generateId();
    const now = new Date();

    const household: Household = {
        id: householdId,
        name: "My Household",
        createdBy: userId,
        creationDate: now
    };

    const member: HouseholdMember = {
        id: generateId(),
        householdId,
        userId,
        joinedDate: now
    };

    return { household, members: [member] };
}

// Pre-generated stable seed data — Alice has a household, Bob does not
const aliceHousehold = generateHouseholds("user-alice");

export const defaultSeedHouseholds: Household[] = [aliceHousehold.household];
export const defaultSeedMembers: HouseholdMember[] = [...aliceHousehold.members];
