import { useQuery } from "@tanstack/react-query";

import { parseCareEvent } from "@packages/api/entities/care-events";

const CARE_EVENTS_KEY_PREFIX = ["management", "care-events"];

export function useManagementCareEvents(plantId: string | undefined) {
    return useQuery({
        queryKey: [...CARE_EVENTS_KEY_PREFIX, plantId],
        queryFn: async () => {
            const response = await fetch(`/api/management/plants/${plantId}/care-events`);

            if (!response.ok) {
                throw new Error(`Failed to fetch care events: ${response.status}`);
            }

            const data: unknown[] = await response.json();

            return data.map(item => parseCareEvent(item as Record<string, unknown>));
        },
        enabled: !!plantId
    });
}
