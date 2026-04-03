export interface ResponsibilityAssignment {
    id: string;
    plantId: string;
    householdId: string;
    strategy: "fixed" | "rotating" | "unassigned";
    assignedMemberId?: string;
    assignedMemberName?: string;
}

export function parseResponsibilityAssignment(data: Record<string, unknown>): ResponsibilityAssignment {
    return {
        id: data.id,
        plantId: data.plantId,
        householdId: data.householdId,
        strategy: data.strategy,
        assignedMemberId: data.assignedMemberId,
        assignedMemberName: data.assignedMemberName
    } as ResponsibilityAssignment;
}
