import type { Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NoopLogger } from "@workleap/logging";
import { useEffect, useMemo, type ReactNode } from "react";

import { initializeFireflyForStorybook, withFireflyDecorator } from "../../../../apps/storybook-management/firefly.tsx";
import { createManagementHouseholdCollection } from "./householdCollection.ts";
import { ManagementHouseholdCollectionProvider } from "./ManagementHouseholdContext.tsx";

const AUTH_TOKEN_KEY = "plantz-auth-token";
const DEFAULT_USER_ID = "user-alice";

const runtime = await initializeFireflyForStorybook({
    loggers: [new NoopLogger()]
});

export const fireflyDecorator = withFireflyDecorator(runtime);

function CollectionDecorator({ children, userId }: { children: ReactNode; userId?: string }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false, staleTime: Infinity } }
            }),
        []
    );
    const collection = useMemo(() => createManagementHouseholdCollection(queryClient), [queryClient]);

    // Set auth token so getCurrentUserId() works in stories
    useEffect(() => {
        sessionStorage.setItem(AUTH_TOKEN_KEY, userId ?? DEFAULT_USER_ID);

        return () => {
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
        };
    }, [userId]);

    return (
        <QueryClientProvider client={queryClient}>
            <ManagementHouseholdCollectionProvider collection={collection}>{children}</ManagementHouseholdCollectionProvider>
        </QueryClientProvider>
    );
}

function withCollectionDecorator(): Decorator {
    return story => <CollectionDecorator>{story()}</CollectionDecorator>;
}

export const collectionDecorator = withCollectionDecorator();
