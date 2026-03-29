import type { HouseholdInvitation } from "../householdInvitationSchema.ts";

export const FIXED_INVITATION_DATE = new Date(2025, 0, 1, 0, 0, 0, 0);

export function makeInvitation(
    overrides: Partial<HouseholdInvitation> & { id: string; householdId: string; inviteeEmail: string }
): HouseholdInvitation {
    return {
        invitedBy: "user-alice",
        status: "pending",
        creationDate: FIXED_INVITATION_DATE,
        ...overrides
    };
}
