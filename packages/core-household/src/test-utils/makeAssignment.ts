import type { ResponsibilityAssignment } from "../responsibilityAssignmentSchema.ts";

export const FIXED_ROTATION_DATE = new Date(2025, 0, 1, 0, 0, 0, 0);

export function makeAssignment(
    overrides: Partial<ResponsibilityAssignment> & { id: string; plantId: string; householdId: string }
): ResponsibilityAssignment {
    return {
        strategy: "unassigned",
        ...overrides
    };
}
