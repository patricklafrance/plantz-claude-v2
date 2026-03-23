import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";

import { makeAdjustmentEvent, makeAdjustmentRecommendation } from "@packages/core-plants/test-utils";

import { AdjustmentSection } from "./AdjustmentSection.tsx";
import { createAdjustmentHandlers } from "./mocks/index.ts";
import { fireflyDecorator } from "./storybook.setup.tsx";

function QueryDecorator({ children }: { children: ReactNode }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false, staleTime: Infinity } },
            }),
        [],
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const meta = {
    title: "Today/LandingPage/Components/AdjustmentSection",
    component: AdjustmentSection,
    parameters: {
        chromatic: {
            modes: {
                "light mobile": { theme: "light", viewport: 375 },
                "light tablet": { theme: "light", viewport: 768 },
                "light desktop": { theme: "light", viewport: 1280 },
                "dark mobile": { theme: "dark", viewport: 375 },
                "dark tablet": { theme: "dark", viewport: 768 },
                "dark desktop": { theme: "dark", viewport: 1280 },
            },
        },
    },
    args: {
        plantId: "plant-1",
        currentIntervalDays: 7,
        onAdjustmentAccepted: () => {},
    },
    decorators: [
        (story) => <QueryDecorator>{story()}</QueryDecorator>,
        fireflyDecorator,
        (Story) => (
            <div className="max-w-lg p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AdjustmentSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithRecommendation: Story = {
    parameters: {
        msw: {
            handlers: createAdjustmentHandlers({
                recommendation: makeAdjustmentRecommendation(),
                history: [],
            }),
        },
    },
};

export const NoRecommendation: Story = {
    parameters: {
        msw: {
            handlers: createAdjustmentHandlers({
                recommendation: null,
                history: [],
            }),
        },
    },
};

export const WithHistory: Story = {
    parameters: {
        msw: {
            handlers: createAdjustmentHandlers({
                recommendation: null,
                history: [makeAdjustmentEvent({ id: "adj-1", adjustmentDate: new Date(2024, 6, 15), previousInterval: 7, newInterval: 5 }), makeAdjustmentEvent({ id: "adj-2", adjustmentDate: new Date(2024, 5, 20), previousInterval: 10, newInterval: 7, note: "Summer heat adjustment" })],
            }),
        },
    },
};

export const WithRecommendationAndHistory: Story = {
    parameters: {
        msw: {
            handlers: createAdjustmentHandlers({
                recommendation: makeAdjustmentRecommendation(),
                history: [makeAdjustmentEvent({ id: "adj-1", adjustmentDate: new Date(2024, 6, 15), previousInterval: 14, newInterval: 7 })],
            }),
        },
    },
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: createAdjustmentHandlers("loading"),
        },
    },
};
