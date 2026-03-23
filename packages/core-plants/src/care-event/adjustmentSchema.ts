import { z } from "zod";

export const adjustmentRecommendationSchema = z.object({
    plantId: z.string(),
    currentInterval: z.number(),
    suggestedInterval: z.number(),
    explanation: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    recentBehaviorSummary: z.string(),
});

export const adjustmentEventSchema = z.object({
    id: z.string(),
    plantId: z.string(),
    previousInterval: z.number(),
    newInterval: z.number(),
    adjustmentDate: z.coerce.date(),
    note: z.string().optional(),
});
