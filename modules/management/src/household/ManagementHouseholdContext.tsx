import { createContext, useContext, type ReactNode } from "react";

import type { HouseholdCollection } from "@packages/core-plants/collection";

const ManagementHouseholdCollectionContext = createContext<HouseholdCollection | null>(null);

export function ManagementHouseholdCollectionProvider({ collection, children }: { collection: HouseholdCollection; children: ReactNode }) {
    return <ManagementHouseholdCollectionContext value={collection}>{children}</ManagementHouseholdCollectionContext>;
}

export function useManagementHouseholdCollection(): HouseholdCollection {
    const collection = useContext(ManagementHouseholdCollectionContext);

    if (!collection) {
        throw new Error("useManagementHouseholdCollection must be used within a ManagementHouseholdCollectionProvider.");
    }

    return collection;
}
