import type { Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NoopLogger } from "@workleap/logging";
import { useMemo, type ReactNode } from "react";

import { initializeFireflyForStorybook, withFireflyDecorator } from "../../storybook/firefly.tsx";
import { createTodayPlantsCollection } from "./plantsCollection.ts";
import { TodayPlantsCollectionProvider } from "./TodayPlantsContext.tsx";

const runtime = await initializeFireflyForStorybook({
    loggers: [new NoopLogger()],
});

export const fireflyDecorator = withFireflyDecorator(runtime);

function CollectionDecorator({ children }: { children: ReactNode }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false, staleTime: Infinity } },
            }),
        [],
    );
    const collection = useMemo(() => createTodayPlantsCollection(queryClient), [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            <TodayPlantsCollectionProvider collection={collection}>{children}</TodayPlantsCollectionProvider>
        </QueryClientProvider>
    );
}

function withCollectionDecorator(): Decorator {
    return (story) => <CollectionDecorator>{story()}</CollectionDecorator>;
}

export const collectionDecorator = withCollectionDecorator();
