import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { createTodayVacationPlantsCollection } from "./plantsCollection.ts";
import { TodayVacationPlantsCollectionProvider } from "./TodayVacationPlantsContext.tsx";
import { VacationPlannerNavLabel } from "./VacationPlannerNavLabel.tsx";

function registerRoutes(runtime: FireflyRuntime, collection: ReturnType<typeof createTodayVacationPlantsCollection>) {
    runtime.registerRoute({
        path: "/today/vacation-planner",
        lazy: async () => {
            const { VacationPlannerPage } = await import("./VacationPlannerPage.tsx");

            return {
                element: (
                    <TodayVacationPlantsCollectionProvider collection={collection}>
                        <VacationPlannerPage />
                    </TodayVacationPlantsCollectionProvider>
                ),
            };
        },
    });

    runtime.registerNavigationItem({
        $id: "today-vacation-planner",
        $label: <VacationPlannerNavLabel />,
        $priority: 95,
        to: "/today/vacation-planner",
    });
}

export async function registerTodayVacationPlanner(runtime: FireflyRuntime, queryClient: QueryClient) {
    const collection = createTodayVacationPlantsCollection(queryClient);
    registerRoutes(runtime, collection);

    if (runtime.isMswEnabled) {
        const { todayVacationPlannerHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(todayVacationPlannerHandlers);
    }
}
