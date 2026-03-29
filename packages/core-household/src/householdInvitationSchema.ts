import { z } from "zod";

export const householdInvitationSchema = z.object({
    id: z.string(),
    householdId: z.string(),
    invitedBy: z.string(),
    inviteeEmail: z.string(),
    status: z.enum(["pending", "accepted", "declined"]),
    creationDate: z.coerce.date()
});

export type HouseholdInvitation = z.infer<typeof householdInvitationSchema>;
