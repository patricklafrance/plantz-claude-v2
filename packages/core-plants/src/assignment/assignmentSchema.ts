import { z } from "zod";

export const responsibilityAssignmentSchema = z.object({
    id: z.string(),
    householdId: z.string(),
    plantId: z.string(),
    assignmentType: z.enum(["fixed", "rotating", "unassigned"]),
    assignedUserId: z.string().optional()
});

export type ResponsibilityAssignment = z.infer<typeof responsibilityAssignmentSchema>;
