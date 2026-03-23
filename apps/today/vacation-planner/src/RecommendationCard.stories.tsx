import type { Meta, StoryObj } from "@storybook/react-vite";

import type { PlantRecommendation } from "@packages/core-plants/vacation";

import { RecommendationCard } from "./RecommendationCard.tsx";

const FAR_FUTURE = new Date(2099, 0, 1);

function makeRecommendation(overrides: Partial<PlantRecommendation> = {}): PlantRecommendation {
    return {
        plantId: "plant-1",
        plantName: "Monstera Deliciosa",
        type: "water-before-trip",
        reasoning: "Water this plant before you leave. Next watering is due May 28.",
        suggestedActionDate: new Date(2099, 4, 28),
        riskLevel: "low",
        ...overrides,
    };
}

const meta = {
    title: "Today/VacationPlanner/Components/RecommendationCard",
    component: RecommendationCard,
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
        onDelegate: () => {},
        onOverride: () => {},
    },
    decorators: [
        (Story) => (
            <div className="w-full max-w-[600px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof RecommendationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WaterBeforeTrip: Story = {
    args: {
        recommendation: makeRecommendation(),
    },
};

export const SafeUntilReturn: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "safe-until-return",
            reasoning: "This plant won't need watering until after your return.",
            suggestedActionDate: FAR_FUTURE,
            riskLevel: "low",
        }),
    },
};

export const DelegateWatering: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "delegate-watering",
            reasoning: "This plant needs 2 waterings during your trip. Ask someone to help.",
            suggestedActionDate: new Date(2099, 5, 5),
            riskLevel: "medium",
            delegation: {
                helperName: "Alice",
                wateringDate: new Date(2099, 5, 5),
                notes: "Water in the morning",
            },
        }),
    },
};

export const DelegateWateringNoDelegation: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "delegate-watering",
            reasoning: "This plant needs 1 watering during your trip. Ask someone to help.",
            suggestedActionDate: new Date(2099, 5, 8),
            riskLevel: "medium",
        }),
    },
};

export const AlreadyOverdue: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "already-overdue",
            plantName: "Wilting Fern",
            reasoning: "This plant was due for watering and is overdue. Water it as soon as possible.",
            suggestedActionDate: new Date(2099, 4, 25),
            riskLevel: "high",
        }),
    },
};

export const MediumRisk: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "delegate-watering",
            reasoning: "This plant needs watering during your trip. Due close to your return date.",
            suggestedActionDate: new Date(2099, 5, 12),
            riskLevel: "medium",
        }),
    },
};

export const WithUserOverride: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "delegate-watering",
            override: "water-before-trip",
            reasoning: "This plant needs watering during your trip. Ask someone to help.",
            suggestedActionDate: new Date(2099, 5, 5),
            riskLevel: "medium",
        }),
    },
};

export const SafeUntilReturnWithOverrideButton: Story = {
    args: {
        recommendation: makeRecommendation({
            type: "safe-until-return",
            reasoning: "This plant won't need watering until after your return.",
            suggestedActionDate: FAR_FUTURE,
            riskLevel: "low",
        }),
    },
};

export const LongPlantName: Story = {
    args: {
        recommendation: makeRecommendation({
            plantName: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant Collection Series Two",
        }),
    },
};
