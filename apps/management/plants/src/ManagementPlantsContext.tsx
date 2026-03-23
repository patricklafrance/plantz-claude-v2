import { createContext, useContext, type ReactNode } from "react";

import type { PlantsCollection } from "@packages/core-plants/collection";

const ManagementPlantsCollectionContext = createContext<PlantsCollection | null>(null);

export function ManagementPlantsCollectionProvider({ collection, children }: { collection: PlantsCollection; children: ReactNode }) {
    return <ManagementPlantsCollectionContext value={collection}>{children}</ManagementPlantsCollectionContext>;
}

export function useManagementPlantsCollection(): PlantsCollection {
    const collection = useContext(ManagementPlantsCollectionContext);

    if (!collection) {
        throw new Error("useManagementPlantsCollection must be used within a ManagementPlantsCollectionProvider.");
    }

    return collection;
}
