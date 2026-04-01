import { z } from "zod";

export const responsibilityAssignmentSchema = z.object({
    id: z.string(),
    plantId: z.string(),
    assignedUserId: z.string().optional(),
    assignedUserName: z.string().optional(),
    strategy: z.enum(["fixed", "rotating", "unassigned"]),
    lastRotatedAt: z.coerce.date().optional()
});
