import { z } from "zod";

export const householdMemberSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    email: z.string(),
    role: z.enum(["owner", "member"]),
    joinedAt: z.coerce.date(),
    status: z.enum(["active", "invited"])
});

export const householdSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdAt: z.coerce.date(),
    members: z.array(householdMemberSchema)
});
