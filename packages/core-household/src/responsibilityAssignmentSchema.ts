import { z } from "zod";

export const responsibilityAssignmentSchema = z.object({
    id: z.string(),
    plantId: z.string(),
    householdId: z.string(),
    strategy: z.enum(["fixed", "rotating", "unassigned"]),
    assignedUserId: z.string().optional(),
    lastRotatedDate: z.coerce.date().optional()
});

export type ResponsibilityAssignment = z.infer<typeof responsibilityAssignmentSchema>;
