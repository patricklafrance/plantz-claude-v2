import type { Meta, StoryObj } from "@storybook/react-vite";

import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/core-plants/test-utils";
import type { VacationPlan } from "@packages/core-plants/vacation";

import { createTodayVacationPlannerHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";
import { VacationPlannerPage } from "./VacationPlannerPage.tsx";

// Trip dates far in the future so stories are deterministic
const TRIP_START = new Date(2099, 5, 1); // June 1, 2099
const TRIP_END = new Date(2099, 5, 14); // June 14, 2099

const mixedPlants = [
    // Already overdue — next watering is in the far past
    makePlant({ id: "overdue-1", name: "Wilting Fern", nextWateringDate: FAR_PAST, wateringFrequency: "1-week" }),
    // Water before trip — next watering between "today" and trip start
    makePlant({ id: "before-1", name: "Aloe Vera", nextWateringDate: new Date(2099, 4, 28), wateringFrequency: "1-week" }),
    // Delegate watering — next watering during the trip
    makePlant({ id: "delegate-1", name: "Boston Fern", nextWateringDate: new Date(2099, 5, 5), wateringFrequency: "0.5-week" }),
    makePlant({ id: "delegate-2", name: "Peace Lily", nextWateringDate: new Date(2099, 5, 8), wateringFrequency: "1-week" }),
    // Safe until return — next watering after trip ends
    makePlant({ id: "safe-1", name: "Cactus", nextWateringDate: FAR_FUTURE, wateringFrequency: "2.5-weeks" }),
    makePlant({ id: "safe-2", name: "Snake Plant", nextWateringDate: new Date(2099, 5, 20), wateringFrequency: "2-weeks" }),
];

const draftPlanRecommendations = [
    {
        plantId: "overdue-1",
        plantName: "Wilting Fern",
        type: "already-overdue" as const,
        reasoning: "This plant was due for watering and is overdue. Water it as soon as possible.",
        suggestedActionDate: new Date(2099, 4, 25),
        riskLevel: "high" as const,
    },
    {
        plantId: "before-1",
        plantName: "Aloe Vera",
        type: "water-before-trip" as const,
        reasoning: "Water this plant before you leave. Next watering is due May 28.",
        suggestedActionDate: new Date(2099, 4, 28),
        riskLevel: "low" as const,
    },
    {
        plantId: "delegate-1",
        plantName: "Boston Fern",
        type: "delegate-watering" as const,
        reasoning: "This plant needs 2 waterings during your trip. Ask someone to help.",
        suggestedActionDate: new Date(2099, 5, 5),
        riskLevel: "medium" as const,
    },
    {
        plantId: "delegate-2",
        plantName: "Peace Lily",
        type: "delegate-watering" as const,
        reasoning: "This plant needs 1 watering during your trip. Ask someone to help.",
        suggestedActionDate: new Date(2099, 5, 8),
        riskLevel: "medium" as const,
    },
    {
        plantId: "safe-1",
        plantName: "Cactus",
        type: "safe-until-return" as const,
        reasoning: "This plant won't need watering until after your return.",
        suggestedActionDate: FAR_FUTURE,
        riskLevel: "low" as const,
    },
    {
        plantId: "safe-2",
        plantName: "Snake Plant",
        type: "safe-until-return" as const,
        reasoning: "This plant won't need watering until Jun 20, after your return.",
        suggestedActionDate: new Date(2099, 5, 20),
        riskLevel: "low" as const,
    },
];

const draftPlan: VacationPlan = {
    id: "plan-draft",
    startDate: TRIP_START,
    endDate: TRIP_END,
    strategy: "balanced",
    status: "draft",
    recommendations: draftPlanRecommendations,
    createdAt: new Date(2099, 4, 20),
    updatedAt: new Date(2099, 4, 20),
};

const savedPlan: VacationPlan = {
    ...draftPlan,
    id: "plan-1",
    status: "active",
};

const meta = {
    title: "Today/VacationPlanner/Pages/VacationPlannerPage",
    component: VacationPlannerPage,
    decorators: [collectionDecorator, fireflyDecorator],
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
} satisfies Meta<typeof VacationPlannerPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers(mixedPlants, draftPlan),
        },
    },
};

export const Empty: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers([]),
        },
    },
};

export const AllSafeUntilReturn: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers([
                makePlant({ id: "safe-1", name: "Cactus", nextWateringDate: FAR_FUTURE, wateringFrequency: "2.5-weeks" }),
                makePlant({ id: "safe-2", name: "Snake Plant", nextWateringDate: new Date(2099, 5, 20), wateringFrequency: "2-weeks" }),
                makePlant({ id: "safe-3", name: "ZZ Plant", nextWateringDate: new Date(2099, 5, 25), wateringFrequency: "2-weeks" }),
            ]),
        },
    },
};

export const AllDelegateNeeded: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers([
                makePlant({ id: "del-1", name: "Boston Fern", nextWateringDate: new Date(2099, 5, 3), wateringFrequency: "0.5-week" }),
                makePlant({ id: "del-2", name: "Peace Lily", nextWateringDate: new Date(2099, 5, 5), wateringFrequency: "0.5-week" }),
                makePlant({ id: "del-3", name: "Calathea", nextWateringDate: new Date(2099, 5, 7), wateringFrequency: "1-week" }),
                makePlant({ id: "del-4", name: "Maidenhair Fern", nextWateringDate: new Date(2099, 5, 4), wateringFrequency: "0.5-week" }),
            ]),
        },
    },
};

export const OverduePlants: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers([
                makePlant({ id: "overdue-1", name: "Wilting Fern", nextWateringDate: FAR_PAST, wateringFrequency: "1-week" }),
                makePlant({ id: "overdue-2", name: "Dry Orchid", nextWateringDate: FAR_PAST, wateringFrequency: "0.5-week" }),
                makePlant({ id: "safe-1", name: "Cactus", nextWateringDate: FAR_FUTURE, wateringFrequency: "2.5-weeks" }),
            ]),
        },
    },
};

export const SavedPlan: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers(mixedPlants, savedPlan),
        },
    },
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: createTodayVacationPlannerHandlers("loading"),
        },
    },
};
