import { createContext, useContext, type ReactNode } from "react";

import type { PlantsCollection } from "@packages/core-plants/collection";

const TodayPlantsCollectionContext = createContext<PlantsCollection | null>(null);

export function TodayPlantsCollectionProvider({ collection, children }: { collection: PlantsCollection; children: ReactNode }) {
    return <TodayPlantsCollectionContext value={collection}>{children}</TodayPlantsCollectionContext>;
}

export function useTodayPlantsCollection(): PlantsCollection {
    const collection = useContext(TodayPlantsCollectionContext);

    if (!collection) {
        throw new Error("useTodayPlantsCollection must be used within a TodayPlantsCollectionProvider.");
    }

    return collection;
}
