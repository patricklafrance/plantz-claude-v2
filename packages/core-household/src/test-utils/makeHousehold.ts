import type { Household } from "../householdSchema.ts";

export const FIXED_CREATION = new Date(2025, 0, 1, 0, 0, 0, 0);

export function makeHousehold(overrides: Partial<Household> & { id: string; name: string }): Household {
    return {
        createdBy: "user-alice",
        creationDate: FIXED_CREATION,
        ...overrides
    };
}
