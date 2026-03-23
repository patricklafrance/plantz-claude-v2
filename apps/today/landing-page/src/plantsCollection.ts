import type { QueryClient } from "@tanstack/react-query";

import { getAuthHeaders } from "@packages/core-module";
import { plantSchema, type Plant } from "@packages/core-plants";
import { createPlantsCollection, type PlantsCollection } from "@packages/core-plants/collection";

const API_BASE = "/api/today/plants";

async function fetchPlants(): Promise<Plant[]> {
    const response = await fetch(API_BASE, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch plants: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => plantSchema.parse(item));
}

export function createTodayPlantsCollection(queryClient: QueryClient): PlantsCollection {
    return createPlantsCollection({
        queryKey: ["today", "plants", "list"],
        queryFn: fetchPlants,
        queryClient,
    });
}
