import { z } from "zod";

export const householdSchema = z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    createdAt: z.coerce.date()
});

export type Household = z.infer<typeof householdSchema>;
