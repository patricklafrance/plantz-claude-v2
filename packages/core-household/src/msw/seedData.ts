import type { HouseholdInvitation } from "../householdInvitationSchema.ts";
import type { HouseholdMember } from "../householdMemberSchema.ts";
import type { Household } from "../householdSchema.ts";
import type { ResponsibilityAssignment } from "../responsibilityAssignmentSchema.ts";

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

// Pre-generated stable seed invitation — Alice invited Bob (pending)
export const defaultSeedInvitations: HouseholdInvitation[] = [
    {
        id: "inv-alice-bob",
        householdId: aliceHousehold.household.id,
        invitedBy: "user-alice",
        inviteeEmail: "bob@example.com",
        status: "pending",
        creationDate: new Date(2025, 0, 2)
    }
];

// Seed assignments are populated by the host after plants are shared.
// This empty default is used by reset(); the host generates assignments
// for pre-shared plants covering all three strategies.
export const defaultSeedAssignments: ResponsibilityAssignment[] = [];
