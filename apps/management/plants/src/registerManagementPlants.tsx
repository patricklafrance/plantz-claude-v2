import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { ManagementPlantsCollectionProvider } from "./ManagementPlantsContext.tsx";
import { createManagementPlantsCollection } from "./plantsCollection.ts";

function registerRoutes(runtime: FireflyRuntime, collection: ReturnType<typeof createManagementPlantsCollection>) {
    runtime.registerRoute({
        path: "/management/plants",
        lazy: async () => {
            const { PlantsPage } = await import("./PlantsPage.tsx");

            return {
                element: (
                    <ManagementPlantsCollectionProvider collection={collection}>
                        <PlantsPage />
                    </ManagementPlantsCollectionProvider>
                ),
            };
        },
    });

    runtime.registerNavigationItem({
        $id: "management-plants",
        $label: "My Plants",
        $priority: 90,
        to: "/management/plants",
    });
}

export async function registerManagementPlants(runtime: FireflyRuntime, queryClient: QueryClient) {
    const collection = createManagementPlantsCollection(queryClient);
    registerRoutes(runtime, collection);

    if (runtime.isMswEnabled) {
        const { managementPlantHandlers, managementCareEventHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
        runtime.registerRequestHandlers(managementCareEventHandlers);
    }
}
