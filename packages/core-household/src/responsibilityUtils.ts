import type { HouseholdMember } from "./householdMemberSchema.ts";
import type { ResponsibilityAssignment } from "./responsibilityAssignmentSchema.ts";

/**
 * Resolves the currently responsible userId for a given assignment.
 *
 * - "fixed": returns the explicitly assigned user
 * - "rotating": cycles through members by index, using member order as the rotation basis
 * - "unassigned": returns undefined (anyone can handle it)
 */
export function resolveResponsibleUser(assignment: ResponsibilityAssignment, members: HouseholdMember[]): string | undefined {
    if (assignment.strategy === "fixed") {
        return assignment.assignedUserId;
    }

    if (assignment.strategy === "rotating") {
        if (members.length === 0) {
            return undefined;
        }

        // Sort members deterministically by joinedDate, then by id as tiebreaker
        const sorted = [...members].sort((a, b) => {
            const dateDiff = a.joinedDate.getTime() - b.joinedDate.getTime();

            if (dateDiff !== 0) {
                return dateDiff;
            }

            return a.id.localeCompare(b.id);
        });

        // Use day-based rotation from lastRotatedDate (or fallback to index 0)
        if (assignment.lastRotatedDate) {
            const daysSinceRotation = Math.floor((Date.now() - assignment.lastRotatedDate.getTime()) / (1000 * 60 * 60 * 24));
            const index = daysSinceRotation % sorted.length;

            return sorted[index]!.userId;
        }

        return sorted[0]!.userId;
    }

    // "unassigned"
    return undefined;
}
