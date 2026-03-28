import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { createManagementHouseholdCollection } from "./householdCollection.ts";
import { ManagementHouseholdCollectionProvider } from "./ManagementHouseholdContext.tsx";

function registerRoutes(runtime: FireflyRuntime, collection: ReturnType<typeof createManagementHouseholdCollection>) {
    runtime.registerRoute({
        path: "/management/household",
        lazy: async () => {
            const { HouseholdPage } = await import("./HouseholdPage.tsx");

            return {
                element: (
                    <ManagementHouseholdCollectionProvider collection={collection}>
                        <HouseholdPage />
                    </ManagementHouseholdCollectionProvider>
                )
            };
        }
    });

    runtime.registerNavigationItem({
        $id: "management-household",
        $label: "Household",
        $priority: 80,
        to: "/management/household"
    });
}

export async function registerManagementHousehold(runtime: FireflyRuntime, queryClient: QueryClient) {
    const collection = createManagementHouseholdCollection(queryClient);
    registerRoutes(runtime, collection);

    if (runtime.isMswEnabled) {
        const { managementHouseholdHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementHouseholdHandlers);
    }
}
