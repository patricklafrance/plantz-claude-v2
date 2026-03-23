import { getAuthHeaders } from "@packages/core-module";
import type { AdjustmentEvent, AdjustmentRecommendation } from "@packages/core-plants/care-event";
import { adjustmentEventSchema, adjustmentRecommendationSchema } from "@packages/core-plants/care-event";

export async function fetchAdjustmentRecommendation(plantId: string, currentIntervalDays: number): Promise<AdjustmentRecommendation | null> {
    const params = new URLSearchParams({
        plantId,
        currentInterval: String(currentIntervalDays),
    });

    const response = await fetch(`/api/today/adjustments/recommendation?${params.toString()}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch adjustment recommendation: ${response.status}`);
    }

    const data = await response.json();

    if (data === null || (typeof data === "object" && Object.keys(data).length === 0)) {
        return null;
    }

    return adjustmentRecommendationSchema.parse(data);
}

export async function acceptAdjustment(plantId: string, previousInterval: number, newInterval: number, note?: string): Promise<AdjustmentEvent> {
    const response = await fetch("/api/today/adjustments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ plantId, previousInterval, newInterval, note }),
    });

    if (!response.ok) {
        throw new Error(`Failed to accept adjustment: ${response.status}`);
    }

    const data = await response.json();

    return adjustmentEventSchema.parse(data);
}

export async function dismissRecommendation(plantId: string): Promise<void> {
    const response = await fetch("/api/today/adjustments/dismiss", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ plantId }),
    });

    if (!response.ok) {
        throw new Error(`Failed to dismiss recommendation: ${response.status}`);
    }
}

export async function fetchAdjustmentHistory(plantId: string): Promise<AdjustmentEvent[]> {
    const response = await fetch(`/api/today/adjustments?plantId=${encodeURIComponent(plantId)}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch adjustment history: ${response.status}`);
    }

    const data = (await response.json()) as unknown[];

    return data.map((item) => adjustmentEventSchema.parse(item));
}
