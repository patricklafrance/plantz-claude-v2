import type { Household, HouseholdMember } from "../entities/household/types.ts";
import { FIXED_CREATION } from "./makePlant.ts";

export function makeHousehold(overrides: Partial<Household> & { id: string; name: string }): Household {
    return {
        createdBy: "user-alice",
        creationDate: FIXED_CREATION,
        ...overrides
    };
}

export function makeHouseholdMember(overrides: Partial<HouseholdMember> & { id: string; userId: string; userName: string }): HouseholdMember {
    return {
        householdId: "household-1",
        role: "member",
        joinDate: FIXED_CREATION,
        ...overrides
    };
}
