import type { Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NoopLogger } from "@workleap/logging";

import { SessionProvider } from "@packages/core-module";

import { initializeFireflyForStorybook, withFireflyDecorator } from "../../../../apps/management-storybook/firefly.tsx";

const runtime = await initializeFireflyForStorybook({
    loggers: [new NoopLogger()]
});

export const fireflyDecorator = withFireflyDecorator(runtime);

export const sessionDecorator: Decorator = Story => (
    <QueryClientProvider client={new QueryClient()}>
        <SessionProvider session={{ id: "user-alice", name: "Alice Johnson", email: "alice@example.com" }}>
            <Story />
        </SessionProvider>
    </QueryClientProvider>
);
