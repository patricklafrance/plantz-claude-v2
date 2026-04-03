import type { ResponsibilityAssignment } from "../entities/responsibility/types.ts";

export function makeAssignment(overrides: Partial<ResponsibilityAssignment> & { id: string; plantId: string }): ResponsibilityAssignment {
    return {
        householdId: "household-1",
        strategy: "unassigned",
        ...overrides
    };
}
