import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import type { HouseholdCollection } from "@packages/core-plants/collection";

import { createManagementHouseholdCollection } from "../household/householdCollection.ts";
import { ManagementHouseholdCollectionProvider } from "../household/ManagementHouseholdContext.tsx";
import { ManagementPlantsCollectionProvider } from "./ManagementPlantsContext.tsx";
import { createManagementPlantsCollection } from "./plantsCollection.ts";

function registerRoutes(
    runtime: FireflyRuntime,
    plantsCollection: ReturnType<typeof createManagementPlantsCollection>,
    householdCollection: HouseholdCollection
) {
    runtime.registerRoute({
        path: "/management/plants",
        lazy: async () => {
            const { PlantsPage } = await import("./PlantsPage.tsx");

            return {
                element: (
                    <ManagementHouseholdCollectionProvider collection={householdCollection}>
                        <ManagementPlantsCollectionProvider collection={plantsCollection}>
                            <PlantsPage />
                        </ManagementPlantsCollectionProvider>
                    </ManagementHouseholdCollectionProvider>
                )
            };
        }
    });

    runtime.registerNavigationItem({
        $id: "management-plants",
        $label: "My Plants",
        $priority: 90,
        to: "/management/plants"
    });
}

export async function registerManagementPlants(runtime: FireflyRuntime, queryClient: QueryClient) {
    const plantsCollection = createManagementPlantsCollection(queryClient);
    const householdCollection = createManagementHouseholdCollection(queryClient);
    registerRoutes(runtime, plantsCollection, householdCollection);

    if (runtime.isMswEnabled) {
        const { managementPlantHandlers, managementCareEventHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
        runtime.registerRequestHandlers(managementCareEventHandlers);
    }
}
