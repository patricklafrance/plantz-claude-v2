import type { Meta, StoryObj } from "@storybook/react-vite";

import type { CareEventType } from "@packages/core-plants/care-event";
import { makeCareEvent } from "@packages/core-plants/test-utils";

import { CareHistoryTimeline } from "./CareHistoryTimeline.tsx";

const meta = {
    title: "Today/LandingPage/Components/CareHistoryTimeline",
    component: CareHistoryTimeline,
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
    decorators: [
        (Story) => (
            <div className="max-w-lg p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CareHistoryTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        events: [
            makeCareEvent({ eventDate: new Date(2024, 6, 15), eventType: "watered", notes: "Soil was dry" }),
            makeCareEvent({ eventDate: new Date(2024, 6, 10), eventType: "skipped", notes: "Soil still moist" }),
            makeCareEvent({ eventDate: new Date(2024, 6, 5), eventType: "watered" }),
            makeCareEvent({ eventDate: new Date(2024, 5, 28), eventType: "delegated", notes: "Asked neighbor" }),
            makeCareEvent({ eventDate: new Date(2024, 5, 21), eventType: "watered" }),
        ],
    },
};

export const Empty: Story = {
    args: {
        events: [],
    },
};

export const SingleEvent: Story = {
    args: {
        events: [makeCareEvent({ eventDate: new Date(2024, 6, 15), eventType: "watered" })],
    },
};

export const MultipleEventsPerDay: Story = {
    args: {
        events: [makeCareEvent({ eventDate: new Date(2024, 6, 15), eventType: "watered", notes: "Morning" }), makeCareEvent({ eventDate: new Date(2024, 6, 15), eventType: "delegated", notes: "Evening" }), makeCareEvent({ eventDate: new Date(2024, 6, 10), eventType: "watered" })],
    },
};

export const LongHistory: Story = {
    args: {
        events: Array.from({ length: 30 }, (_, i) => {
            const types: CareEventType[] = ["watered", "skipped", "delegated"];
            const eventDate = new Date(2024, 6, 30 - i);

            return makeCareEvent({
                eventDate,
                eventType: types[i % 3]!,
                notes: i % 3 === 0 ? `Event note #${i + 1}` : undefined,
            });
        }),
    },
};
