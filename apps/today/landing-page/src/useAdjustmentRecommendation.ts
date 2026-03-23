import { useQuery } from "@tanstack/react-query";

import type { AdjustmentRecommendation } from "@packages/core-plants/care-event";

import { fetchAdjustmentRecommendation } from "./adjustmentsApi.ts";

export function useAdjustmentRecommendation(plantId: string, currentIntervalDays: number) {
    const { data, isLoading } = useQuery<AdjustmentRecommendation | null>({
        queryKey: ["today", "adjustments", "recommendation", plantId, currentIntervalDays],
        queryFn: () => fetchAdjustmentRecommendation(plantId, currentIntervalDays),
    });

    return {
        recommendation: data ?? null,
        isLoading,
    };
}
