import { getAuthHeaders } from "@packages/core-module";
import { careEventSchema } from "@packages/core-plants/care-event";
import type { CareEvent, CareEventType } from "@packages/core-plants/care-event";

export async function fetchCareEvents(plantId: string): Promise<CareEvent[]> {
    const response = await fetch(`/api/today/care-events?plantId=${encodeURIComponent(plantId)}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch care events: ${response.status}`);
    }

    const data = (await response.json()) as unknown[];

    return data.map((item) => careEventSchema.parse(item));
}

export async function createCareEvent(plantId: string, eventType: CareEventType, notes?: string): Promise<CareEvent> {
    const response = await fetch("/api/today/care-events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ plantId, eventType, notes }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create care event: ${response.status}`);
    }

    const data = await response.json();

    return careEventSchema.parse(data);
}

export async function createBulkCareEvents(plantIds: string[], eventType: CareEventType, notes?: string): Promise<CareEvent[]> {
    const response = await fetch("/api/today/care-events/bulk", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ plantIds, eventType, notes }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create bulk care events: ${response.status}`);
    }

    const data = (await response.json()) as unknown[];

    return data.map((item) => careEventSchema.parse(item));
}
