import type { Household, HouseholdMember } from "../household/householdTypes.ts";

export const FIXED_HOUSEHOLD_DATE = new Date(2025, 0, 15, 0, 0, 0, 0);

export function makeHouseholdMember(overrides: Partial<HouseholdMember> & { userId: string; userName: string }): HouseholdMember {
    return {
        email: `${overrides.userId}@example.com`,
        role: "member",
        joinedAt: FIXED_HOUSEHOLD_DATE,
        status: "active",
        ...overrides
    };
}

export function makeHousehold(overrides: Partial<Household> & { id: string; name: string }): Household {
    return {
        createdBy: "user-alice",
        createdAt: FIXED_HOUSEHOLD_DATE,
        members: [makeHouseholdMember({ userId: "user-alice", userName: "Alice", role: "owner" })],
        ...overrides
    };
}
