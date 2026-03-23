import { z } from "zod";

export const plantSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    family: z.string().optional(),
    location: z.string(),
    luminosity: z.string(),
    mistLeaves: z.boolean(),
    soilType: z.string().optional(),
    wateringFrequency: z.string(),
    wateringQuantity: z.string(),
    wateringType: z.string(),
    nextWateringDate: z.coerce.date(),
    creationDate: z.coerce.date(),
    lastUpdateDate: z.coerce.date(),
});

export type Plant = z.infer<typeof plantSchema>;
