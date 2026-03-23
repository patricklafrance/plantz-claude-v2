import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { QueryClient } from "@tanstack/react-query";

import type { Plant } from "../plantSchema.ts";

export interface PlantsCollectionConfig {
    queryKey: readonly unknown[];
    queryFn: () => Promise<Plant[]>;
    queryClient: QueryClient;
}

export type PlantsCollection = ReturnType<typeof createPlantsCollection>;

export function createPlantsCollection(config: PlantsCollectionConfig) {
    return createCollection(
        queryCollectionOptions({
            queryKey: config.queryKey,
            queryFn: config.queryFn,
            queryClient: config.queryClient,
            getKey: (plant: Plant) => plant.id,
        }),
    );
}
