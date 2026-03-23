import type { Meta, StoryObj } from "@storybook/react-vite";

import { AdjustmentHistoryList } from "./AdjustmentHistoryList.tsx";
import { makeAdjustmentEvent } from "./test-utils/makeAdjustment.ts";

const meta = {
    title: "Packages/CorePlants/Components/AdjustmentHistoryList",
    component: AdjustmentHistoryList,
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
} satisfies Meta<typeof AdjustmentHistoryList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithEvents: Story = {
    args: {
        events: [
            makeAdjustmentEvent({ id: "adj-1", adjustmentDate: new Date(2024, 6, 15), previousInterval: 7, newInterval: 5 }),
            makeAdjustmentEvent({ id: "adj-2", adjustmentDate: new Date(2024, 5, 20), previousInterval: 10, newInterval: 7 }),
            makeAdjustmentEvent({ id: "adj-3", adjustmentDate: new Date(2024, 4, 10), previousInterval: 14, newInterval: 10 }),
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
        events: [makeAdjustmentEvent()],
    },
};

export const WithNotes: Story = {
    args: {
        events: [
            makeAdjustmentEvent({ id: "adj-1", adjustmentDate: new Date(2024, 6, 15), previousInterval: 7, newInterval: 5, note: "Plant seemed thirsty, adjusting to water more often." }),
            makeAdjustmentEvent({ id: "adj-2", adjustmentDate: new Date(2024, 5, 20), previousInterval: 14, newInterval: 7, note: "Summer heat requires more frequent watering." }),
        ],
    },
};
