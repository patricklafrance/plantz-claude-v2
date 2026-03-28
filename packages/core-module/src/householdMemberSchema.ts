import { z } from "zod";

export const householdMemberSchema = z.object({
    id: z.string(),
    householdId: z.string(),
    userId: z.string(),
    joinedAt: z.coerce.date()
});

export type HouseholdMember = z.infer<typeof householdMemberSchema>;
