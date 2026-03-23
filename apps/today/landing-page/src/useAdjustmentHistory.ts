import { useQuery } from "@tanstack/react-query";

import type { AdjustmentEvent } from "@packages/core-plants/care-event";

import { fetchAdjustmentHistory } from "./adjustmentsApi.ts";

export function useAdjustmentHistory(plantId: string) {
    const { data, isLoading } = useQuery<AdjustmentEvent[]>({
        queryKey: ["today", "adjustments", "history", plantId],
        queryFn: () => fetchAdjustmentHistory(plantId),
    });

    return {
        events: data ?? [],
        isLoading,
    };
}
