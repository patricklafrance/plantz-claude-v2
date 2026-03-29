import { z } from "zod";

export const householdSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    creationDate: z.coerce.date()
});

export type Household = z.infer<typeof householdSchema>;
