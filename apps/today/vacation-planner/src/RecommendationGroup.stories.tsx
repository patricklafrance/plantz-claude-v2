import type { Meta, StoryObj } from "@storybook/react-vite";

import type { PlantRecommendation } from "@packages/core-plants/vacation";

import { RecommendationGroup } from "./RecommendationGroup.tsx";

function makeRecommendation(overrides: Partial<PlantRecommendation> & { plantId: string; plantName: string }): PlantRecommendation {
    return {
        type: "water-before-trip",
        reasoning: "Water this plant before you leave.",
        suggestedActionDate: new Date(2099, 4, 28),
        riskLevel: "low",
        ...overrides,
    };
}

const meta = {
    title: "Today/VacationPlanner/Components/RecommendationGroup",
    component: RecommendationGroup,
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
            <div className="w-full max-w-[800px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof RecommendationGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WaterBeforeTripGroup: Story = {
    args: {
        type: "water-before-trip",
        recommendations: [makeRecommendation({ plantId: "p1", plantName: "Aloe Vera" }), makeRecommendation({ plantId: "p2", plantName: "Monstera" }), makeRecommendation({ plantId: "p3", plantName: "Pothos" })],
    },
};

export const SafeUntilReturnGroup: Story = {
    args: {
        type: "safe-until-return",
        recommendations: [makeRecommendation({ plantId: "p1", plantName: "Cactus", type: "safe-until-return", riskLevel: "low" }), makeRecommendation({ plantId: "p2", plantName: "Snake Plant", type: "safe-until-return", riskLevel: "low" })],
    },
};

export const DelegateWateringGroup: Story = {
    args: {
        type: "delegate-watering",
        recommendations: [makeRecommendation({ plantId: "p1", plantName: "Boston Fern", type: "delegate-watering", riskLevel: "medium" }), makeRecommendation({ plantId: "p2", plantName: "Peace Lily", type: "delegate-watering", riskLevel: "high" })],
    },
};

export const AlreadyOverdueGroup: Story = {
    args: {
        type: "already-overdue",
        recommendations: [makeRecommendation({ plantId: "p1", plantName: "Wilting Fern", type: "already-overdue", riskLevel: "high" }), makeRecommendation({ plantId: "p2", plantName: "Dry Orchid", type: "already-overdue", riskLevel: "high" })],
    },
};

export const SinglePlant: Story = {
    args: {
        type: "water-before-trip",
        recommendations: [makeRecommendation({ plantId: "p1", plantName: "Aloe Vera" })],
    },
};
