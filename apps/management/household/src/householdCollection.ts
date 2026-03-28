import { createCollection } from "@tanstack/db";
import { createOptimisticAction } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { QueryClient } from "@tanstack/react-query";

import { getAuthHeaders, getCurrentUserId, householdSchema, type Household } from "@packages/core-module";

const API_BASE = "/api/management/households";

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

export type HouseholdsCollection = ReturnType<typeof createManagementHouseholdCollection>;

export function createManagementHouseholdCollection(queryClient: QueryClient) {
    return createCollection(
        queryCollectionOptions({
            queryKey: ["management", "households", "list"],
            queryFn: fetchHouseholds,
            queryClient,
            getKey: (household: Household) => household.id
        })
    );
}

export function createManagementHouseholdActions(collection: HouseholdsCollection) {
    const insertHousehold = createOptimisticAction<{ name: string }>({
        onMutate: data => {
            collection.insert({
                id: crypto.randomUUID(),
                name: data.name,
                ownerId: getCurrentUserId() ?? "",
                createdAt: new Date()
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

            await collection.utils.refetch();
        }
    });

    const updateHousehold = createOptimisticAction<{ id: string; name: string }>({
        onMutate: ({ id, name }) => {
            collection.update(id, draft => {
                draft.name = name;
            });
        },
        mutationFn: async ({ id, name }) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                throw new Error(`Failed to update household ${id}: ${response.status}`);
            }

            await collection.utils.refetch();
        }
    });

    const deleteHousehold = createOptimisticAction<string>({
        onMutate: id => {
            collection.delete(id);
        },
        mutationFn: async id => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to delete household ${id}: ${response.status}`);
            }

            await collection.utils.refetch();
        }
    });

    return { insertHousehold, updateHousehold, deleteHousehold };
}
