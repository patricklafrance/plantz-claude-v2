import type { Meta, StoryObj } from "@storybook/react-vite";

import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/core-plants/test-utils";
import type { VacationPlan } from "@packages/core-plants/vacation";

import { LandingPage } from "./LandingPage.tsx";
import { createTodayPlantHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Today/LandingPage/Pages/LandingPage",
    component: LandingPage,
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
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: mix of due and not-due plants (landing page filters to due only)
export const Default: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE }),
                makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: FAR_PAST }),
                makePlant({ id: "not-due-2", name: "Echeveria", nextWateringDate: FAR_FUTURE }),
            ]),
        },
    },
};

// All plants have future watering dates -- none are due
export const NoPlantsDue: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([makePlant({ id: "future-1", name: "Monstera", nextWateringDate: FAR_FUTURE }), makePlant({ id: "future-2", name: "Pothos", nextWateringDate: FAR_FUTURE }), makePlant({ id: "future-3", name: "Snake Plant", nextWateringDate: FAR_FUTURE })]),
        },
    },
};

// All plants have past watering dates -- all are due
export const AllDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-3", name: "Calathea", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-4", name: "Dracaena", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST }),
            ]),
        },
    },
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({
                    id: "single-1",
                    name: "Monstera Deliciosa",
                    description: "A tropical plant with large fenestrated leaves.",
                    family: "Araceae",
                    nextWateringDate: FAR_PAST,
                }),
            ]),
        },
    },
};

export const Empty: Story = {
    parameters: {
        msw: { handlers: createTodayPlantHandlers([]) },
    },
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createTodayPlantHandlers("loading") },
    },
};

const activePlan: VacationPlan = {
    id: "plan-1",
    startDate: new Date(2099, 5, 1),
    endDate: new Date(2099, 5, 14),
    strategy: "balanced",
    status: "active",
    recommendations: [],
    createdAt: new Date(2099, 4, 20),
    updatedAt: new Date(2099, 4, 20),
};

export const WithActivePlan: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }), makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }), makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE })], activePlan),
        },
    },
};
