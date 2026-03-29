import type { HouseholdMember } from "../householdMemberSchema.ts";

export const FIXED_JOIN_DATE = new Date(2025, 0, 1, 0, 0, 0, 0);

export function makeMember(overrides: Partial<HouseholdMember> & { id: string; userId: string; householdId: string }): HouseholdMember {
    return {
        joinedDate: FIXED_JOIN_DATE,
        ...overrides
    };
}
