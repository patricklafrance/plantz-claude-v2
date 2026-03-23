import { z } from "zod";

export const careEventSchema = z.object({
    id: z.string(),
    plantId: z.string(),
    eventType: z.enum(["watered", "skipped", "delegated"]),
    eventDate: z.coerce.date(),
    notes: z.string().optional(),
});
