import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { createTodayPlantsCollection } from "./plantsCollection.ts";
import { TodayPlantsCollectionProvider } from "./TodayPlantsContext.tsx";

function registerRoutes(runtime: FireflyRuntime, collection: ReturnType<typeof createTodayPlantsCollection>) {
    const lazy = async () => {
        const { LandingPage } = await import("./LandingPage.tsx");

        return {
            element: (
                <TodayPlantsCollectionProvider collection={collection}>
                    <LandingPage />
                </TodayPlantsCollectionProvider>
            )
        };
    };

    runtime.registerRoute({
        index: true,
        lazy
    });

    runtime.registerRoute({
        path: "/today",
        lazy
    });

    runtime.registerNavigationItem({
        $id: "today-landing-page",
        $label: "Today",
        $priority: 100,
        to: "/today"
    });
}

export async function registerTodayLandingPage(runtime: FireflyRuntime, queryClient: QueryClient) {
    const collection = createTodayPlantsCollection(queryClient);
    registerRoutes(runtime, collection);

    if (runtime.isMswEnabled) {
        const {
            todayPlantHandlers,
            todayCareEventHandlers,
            defaultSeedCareEvents,
            careEventsDb,
            todayAdjustmentHandlers,
            adjustmentsDb,
            defaultSeedAdjustments
        } = await import("./mocks/index.ts");
        const { membersDb, assignmentsDb, defaultSeedMembers, defaultSeedAssignments } = await import("@packages/core-household/db");
        careEventsDb.reset(defaultSeedCareEvents);
        adjustmentsDb.reset(defaultSeedAdjustments);
        membersDb.reset(defaultSeedMembers);
        assignmentsDb.reset(defaultSeedAssignments);
        runtime.registerRequestHandlers(todayPlantHandlers);
        runtime.registerRequestHandlers(todayCareEventHandlers);
        runtime.registerRequestHandlers(todayAdjustmentHandlers);
    }
}
