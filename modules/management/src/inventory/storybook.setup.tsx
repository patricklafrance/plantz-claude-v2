import type { Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NoopLogger } from "@workleap/logging";
import { useMemo, type ReactNode } from "react";

import { initializeFireflyForStorybook, withFireflyDecorator } from "../../../../apps/storybook-management/firefly.tsx";
import { createManagementHouseholdCollection } from "../household/householdCollection.ts";
import { ManagementHouseholdCollectionProvider } from "../household/ManagementHouseholdContext.tsx";
import { ManagementPlantsCollectionProvider } from "./ManagementPlantsContext.tsx";
import { createManagementPlantsCollection } from "./plantsCollection.ts";

const runtime = await initializeFireflyForStorybook({
    loggers: [new NoopLogger()]
});

export const fireflyDecorator = withFireflyDecorator(runtime);

function CollectionDecorator({ children }: { children: ReactNode }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false, staleTime: Infinity } }
            }),
        []
    );
    const plantsCollection = useMemo(() => createManagementPlantsCollection(queryClient), [queryClient]);
    const householdCollection = useMemo(() => createManagementHouseholdCollection(queryClient), [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            <ManagementHouseholdCollectionProvider collection={householdCollection}>
                <ManagementPlantsCollectionProvider collection={plantsCollection}>{children}</ManagementPlantsCollectionProvider>
            </ManagementHouseholdCollectionProvider>
        </QueryClientProvider>
    );
}

function withCollectionDecorator(): Decorator {
    return story => <CollectionDecorator>{story()}</CollectionDecorator>;
}

export const collectionDecorator = withCollectionDecorator();
