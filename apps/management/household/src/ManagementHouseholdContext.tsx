import { createContext, useContext, type ReactNode } from "react";

import type { HouseholdsCollection } from "./householdCollection.ts";

const ManagementHouseholdCollectionContext = createContext<HouseholdsCollection | null>(null);

export function ManagementHouseholdCollectionProvider({ collection, children }: { collection: HouseholdsCollection; children: ReactNode }) {
    return <ManagementHouseholdCollectionContext value={collection}>{children}</ManagementHouseholdCollectionContext>;
}

export function useManagementHouseholdCollection(): HouseholdsCollection {
    const collection = useContext(ManagementHouseholdCollectionContext);

    if (!collection) {
        throw new Error("useManagementHouseholdCollection must be used within a ManagementHouseholdCollectionProvider.");
    }

    return collection;
}
