import type { ResponsibilityAssignment } from "@packages/core-plants/assignment";

interface ResponsibilityBadgeProps {
    assignment: ResponsibilityAssignment;
    currentUserId: string;
    memberNameMap: Map<string, string>;
}

export function ResponsibilityBadge({ assignment, currentUserId, memberNameMap }: ResponsibilityBadgeProps) {
    let label: string;

    if (assignment.assignmentType === "unassigned") {
        label = "Anyone";
    } else if (assignment.assignedUserId === currentUserId) {
        label = "Yours";
    } else if (assignment.assignedUserId) {
        label = memberNameMap.get(assignment.assignedUserId) ?? "Someone's";
    } else {
        label = "Anyone";
    }

    return (
        <span
            className="bg-muted text-muted-foreground shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-medium"
            aria-label={`Responsibility: ${label}`}
        >
            {label}
        </span>
    );
}
