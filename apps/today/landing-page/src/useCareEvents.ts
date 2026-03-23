import { useQuery } from "@tanstack/react-query";

import type { CareEvent } from "@packages/core-plants/care-event";

import { fetchCareEvents } from "./careEventsApi.ts";

export function useCareEvents(plantId: string | null) {
    const { data, isLoading, error } = useQuery<CareEvent[]>({
        queryKey: ["today", "care-events", plantId],
        queryFn: () => fetchCareEvents(plantId!),
        enabled: plantId !== null,
    });

    return {
        events: data ?? [],
        isLoading,
        error,
    };
}
