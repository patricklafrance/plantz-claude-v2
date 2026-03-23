import { createOptimisticAction } from "@tanstack/db";
import type { QueryClient } from "@tanstack/react-query";

import { getCurrentUserId, getAuthHeaders } from "@packages/core-module";
import { plantSchema, type Plant } from "@packages/core-plants";
import { createPlantsCollection, type PlantsCollection } from "@packages/core-plants/collection";

const API_BASE = "/api/management/plants";

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

export function createManagementPlantsCollection(queryClient: QueryClient): PlantsCollection {
    return createPlantsCollection({
        queryKey: ["management", "plants", "list"],
        queryFn: fetchPlants,
        queryClient,
    });
}

export function createManagementPlantActions(plantsCollection: PlantsCollection) {
    const insertPlant = createOptimisticAction<Omit<Plant, "id" | "userId" | "creationDate" | "lastUpdateDate">>({
        onMutate: (data) => {
            plantsCollection.insert({
                ...data,
                id: crypto.randomUUID(),
                userId: getCurrentUserId() ?? "",
                creationDate: new Date(),
                lastUpdateDate: new Date(),
            } as Plant);
        },
        mutationFn: async (data) => {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Failed to create plant: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    const updatePlant = createOptimisticAction<{ id: string } & Partial<Plant>>({
        onMutate: ({ id, ...changes }) => {
            plantsCollection.update(id, (draft) => {
                Object.assign(draft, changes, { lastUpdateDate: new Date() });
            });
        },
        mutationFn: async ({ id, ...data }) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Failed to update plant ${id}: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    const deletePlant = createOptimisticAction<string>({
        onMutate: (id) => {
            plantsCollection.delete(id);
        },
        mutationFn: async (id) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete plant ${id}: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    const deletePlants = createOptimisticAction<string[]>({
        onMutate: (ids) => {
            for (const id of ids) {
                plantsCollection.delete(id);
            }
        },
        mutationFn: async (ids) => {
            const response = await fetch(API_BASE, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ ids }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete plants: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    return { insertPlant, updatePlant, deletePlant, deletePlants };
}
