import { createOptimisticAction } from "@tanstack/db";
import type { QueryClient } from "@tanstack/react-query";

import { householdSchema, type Household } from "@packages/core-household";
import { createHouseholdCollection, type HouseholdCollection } from "@packages/core-household/collection";
import { getCurrentUserId, getAuthHeaders } from "@packages/core-module";

const API_BASE = "/api/management/household";

async function fetchHouseholds(): Promise<Household[]> {
    const response = await fetch(API_BASE, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch households: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map(item => householdSchema.parse(item));
}

export function createManagementHouseholdCollection(queryClient: QueryClient): HouseholdCollection {
    return createHouseholdCollection({
        queryKey: ["management", "household", "list"],
        queryFn: fetchHouseholds,
        queryClient
    });
}

export function createManagementHouseholdActions(householdCollection: HouseholdCollection) {
    const insertHousehold = createOptimisticAction<{ name: string }>({
        onMutate: data => {
            householdCollection.insert({
                ...data,
                id: crypto.randomUUID(),
                createdBy: getCurrentUserId() ?? "",
                creationDate: new Date()
            } as Household);
        },
        mutationFn: async data => {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to create household: ${response.status}`);
            }

            await householdCollection.utils.refetch();
        }
    });

    return { insertHousehold };
}
