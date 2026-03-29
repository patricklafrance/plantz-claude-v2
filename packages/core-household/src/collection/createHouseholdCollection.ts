import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { QueryClient } from "@tanstack/react-query";

import type { Household } from "../householdSchema.ts";

export interface HouseholdCollectionConfig {
    queryKey: readonly unknown[];
    queryFn: () => Promise<Household[]>;
    queryClient: QueryClient;
}

export type HouseholdCollection = ReturnType<typeof createHouseholdCollection>;

export function createHouseholdCollection(config: HouseholdCollectionConfig) {
    return createCollection(
        queryCollectionOptions({
            queryKey: config.queryKey,
            queryFn: config.queryFn,
            queryClient: config.queryClient,
            getKey: (household: Household) => household.id
        })
    );
}
