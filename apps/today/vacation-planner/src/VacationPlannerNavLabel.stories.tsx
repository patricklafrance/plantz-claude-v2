import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";

import type { VacationPlan } from "@packages/core-plants/vacation";

import { VacationPlannerNavLabel } from "./VacationPlannerNavLabel.tsx";

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

const meta = {
    title: "Today/VacationPlanner/Components/VacationPlannerNavLabel",
    component: VacationPlannerNavLabel,
} satisfies Meta<typeof VacationPlannerNavLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithActivePlan: Story = {
    parameters: {
        msw: {
            handlers: [http.get("/api/today/vacation-planner/plans/active", () => HttpResponse.json(activePlan))],
        },
    },
};

export const NoActivePlan: Story = {
    parameters: {
        msw: {
            handlers: [http.get("/api/today/vacation-planner/plans/active", () => HttpResponse.json(null))],
        },
    },
};
