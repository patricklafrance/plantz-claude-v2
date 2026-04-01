import { useQuery } from "@tanstack/react-query";

import { fetchAdjustmentHistory } from "./adjustmentsApi.ts";
import type { AdjustmentEvent } from "./adjustmentTypes.ts";

export function useAdjustmentHistory(plantId: string) {
    const { data, isLoading } = useQuery<AdjustmentEvent[]>({
        queryKey: ["today", "adjustments", "history", plantId],
        queryFn: () => fetchAdjustmentHistory(plantId)
    });

    return {
        events: data ?? [],
        isLoading
    };
}
