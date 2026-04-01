import type { HouseholdMember } from "./householdTypes.ts";

/**
 * Look up a member's display name by userId.
 * Returns undefined if the member is not found.
 */
export function resolveMemberName(members: HouseholdMember[], userId: string): string | undefined {
    return members.find(m => m.userId === userId)?.userName;
}
