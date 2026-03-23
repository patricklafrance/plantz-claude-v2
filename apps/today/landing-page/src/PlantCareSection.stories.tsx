import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";

import type { CareEvent } from "@packages/core-plants/care-event";
import { makeAdjustmentRecommendation, makeCareEvent } from "@packages/core-plants/test-utils";

import { createAdjustmentHandlers, createCareEventHandlers } from "./mocks/index.ts";
import { PlantCareSection } from "./PlantCareSection.tsx";
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

const noAdjustmentHandlers = createAdjustmentHandlers({ recommendation: null, history: [] });

const meta = {
    title: "Today/LandingPage/Components/PlantCareSection",
    component: PlantCareSection,
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
        wateringFrequency: "1-week",
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
} satisfies Meta<typeof PlantCareSection>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleEvents: CareEvent[] = [
    makeCareEvent({ id: "e1", eventDate: new Date(2024, 6, 15), eventType: "watered", notes: "Soil was dry" }),
    makeCareEvent({ id: "e2", eventDate: new Date(2024, 6, 10), eventType: "skipped" }),
    makeCareEvent({ id: "e3", eventDate: new Date(2024, 6, 5), eventType: "watered" }),
    makeCareEvent({ id: "e4", eventDate: new Date(2024, 5, 28), eventType: "delegated", notes: "Asked neighbor" }),
    makeCareEvent({ id: "e5", eventDate: new Date(2024, 5, 21), eventType: "watered" }),
    makeCareEvent({ id: "e6", eventDate: new Date(2024, 5, 14), eventType: "watered" }),
];

export const WithHistory: Story = {
    parameters: {
        msw: {
            handlers: [...createCareEventHandlers(sampleEvents), ...noAdjustmentHandlers],
        },
    },
};

export const NoHistory: Story = {
    parameters: {
        msw: {
            handlers: [...createCareEventHandlers([]), ...noAdjustmentHandlers],
        },
    },
};

export const SingleWatering: Story = {
    parameters: {
        msw: {
            handlers: [...createCareEventHandlers([makeCareEvent({ id: "e1", eventDate: new Date(2024, 6, 15), eventType: "watered" })]), ...noAdjustmentHandlers],
        },
    },
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: createCareEventHandlers("loading"),
        },
    },
};

export const WithAdjustmentSuggestion: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createCareEventHandlers(sampleEvents),
                ...createAdjustmentHandlers({
                    recommendation: makeAdjustmentRecommendation(),
                    history: [],
                }),
            ],
        },
    },
};

export const WithAdjustmentHistory: Story = {
    parameters: {
        msw: {
            handlers: [
                ...createCareEventHandlers(sampleEvents),
                ...createAdjustmentHandlers({
                    recommendation: null,
                    history: [
                        {
                            id: "adj-1",
                            plantId: "plant-1",
                            previousInterval: 14,
                            newInterval: 7,
                            adjustmentDate: new Date(2024, 6, 10),
                            note: "Adjusted based on summer watering patterns",
                        },
                    ],
                }),
            ],
        },
    },
};
