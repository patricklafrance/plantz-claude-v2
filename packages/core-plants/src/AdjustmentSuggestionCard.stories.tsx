import type { Meta, StoryObj } from "@storybook/react-vite";

import { AdjustmentSuggestionCard } from "./AdjustmentSuggestionCard.tsx";
import { makeAdjustmentRecommendation } from "./test-utils/makeAdjustment.ts";

const meta = {
    title: "Packages/CorePlants/Components/AdjustmentSuggestionCard",
    component: AdjustmentSuggestionCard,
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
        onAccept: () => {},
        onDismiss: () => {},
    },
    decorators: [
        (Story) => (
            <div className="max-w-lg p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AdjustmentSuggestionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HighConfidence: Story = {
    args: {
        recommendation: makeAdjustmentRecommendation({ confidence: "high" }),
    },
};

export const MediumConfidence: Story = {
    args: {
        recommendation: makeAdjustmentRecommendation({
            confidence: "medium",
            suggestedInterval: 10,
            explanation: "Based on 7 watering events, your plant is being watered less frequently than the current schedule. The average interval is 10.2 days versus the configured 7 days.",
            recentBehaviorSummary: "Recent waterings average 9.8 days apart across the last 5 events.",
        }),
    },
};

export const LowConfidence: Story = {
    args: {
        recommendation: makeAdjustmentRecommendation({
            confidence: "low",
            suggestedInterval: 4,
            explanation: "Based on 5 watering events, your plant is being watered more frequently than the current schedule. The average interval is 3.9 days versus the configured 7 days.",
            recentBehaviorSummary: "Recent waterings average 4.1 days apart across the last 5 events.",
        }),
    },
};

export const LongExplanation: Story = {
    args: {
        recommendation: makeAdjustmentRecommendation({
            confidence: "medium",
            suggestedInterval: 14,
            currentInterval: 7,
            explanation:
                "Based on 15 watering events spanning over three months, your plant is consistently being watered less frequently than the current schedule suggests. The average interval between waterings is 13.7 days versus the configured 7 days. This significant deviation indicates the plant may need less water than originally configured, possibly due to seasonal changes or the plant maturing.",
            recentBehaviorSummary: "Recent waterings average 14.2 days apart across the last 5 events, showing a stable pattern that has been consistent over the past month.",
        }),
    },
};
