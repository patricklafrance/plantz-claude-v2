export type ResponsibilityStrategy = "fixed" | "rotating" | "unassigned";

export interface ResponsibilityAssignment {
    id: string;
    plantId: string;
    assignedUserId?: string;
    assignedUserName?: string;
    strategy: ResponsibilityStrategy;
    lastRotatedAt?: Date;
}
