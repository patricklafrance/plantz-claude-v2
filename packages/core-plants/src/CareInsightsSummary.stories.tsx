import type { Meta, StoryObj } from "@storybook/react-vite";

import type { CareInsight } from "./care-event/careEventTypes.ts";
import { CareInsightsSummary } from "./CareInsightsSummary.tsx";

function makeInsight(overrides: Partial<CareInsight> = {}): CareInsight {
    return {
        lastWateredDate: new Date(2024, 6, 15),
        averageWateringIntervalDays: 7.2,
        wateringStreak: 4,
        missedWateringCount: 2,
        consistencyScore: 85,
        ...overrides,
    };
}

const meta = {
    title: "Packages/CorePlants/Components/CareInsightsSummary",
    component: CareInsightsSummary,
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
} satisfies Meta<typeof CareInsightsSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        insights: makeInsight(),
    },
};

export const NoHistory: Story = {
    args: {
        insights: null,
    },
};

export const HighConsistency: Story = {
    args: {
        insights: makeInsight({
            wateringStreak: 12,
            missedWateringCount: 0,
            consistencyScore: 100,
        }),
    },
};

export const LowConsistency: Story = {
    args: {
        insights: makeInsight({
            wateringStreak: 1,
            missedWateringCount: 8,
            consistencyScore: 42,
        }),
    },
};

export const SingleEvent: Story = {
    args: {
        insights: makeInsight({
            averageWateringIntervalDays: 0,
            wateringStreak: 1,
            missedWateringCount: 0,
            consistencyScore: 100,
        }),
    },
};
