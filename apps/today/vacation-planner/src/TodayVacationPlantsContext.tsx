import { createContext, useContext, type ReactNode } from "react";

import type { PlantsCollection } from "@packages/core-plants/collection";

const TodayVacationPlantsCollectionContext = createContext<PlantsCollection | null>(null);

export function TodayVacationPlantsCollectionProvider({ collection, children }: { collection: PlantsCollection; children: ReactNode }) {
    return <TodayVacationPlantsCollectionContext value={collection}>{children}</TodayVacationPlantsCollectionContext>;
}

export function useTodayVacationPlantsCollection(): PlantsCollection {
    const collection = useContext(TodayVacationPlantsCollectionContext);

    if (!collection) {
        throw new Error("useTodayVacationPlantsCollection must be used within a TodayVacationPlantsCollectionProvider.");
    }

    return collection;
}
