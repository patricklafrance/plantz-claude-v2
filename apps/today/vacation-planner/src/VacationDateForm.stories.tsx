import type { Meta, StoryObj } from "@storybook/react-vite";

import { VacationDateForm } from "./VacationDateForm.tsx";

const meta = {
    title: "Today/VacationPlanner/Components/VacationDateForm",
    component: VacationDateForm,
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
        onGenerate: () => {},
    },
} satisfies Meta<typeof VacationDateForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDates: Story = {
    args: {
        initialStartDate: new Date(2099, 5, 1),
        initialEndDate: new Date(2099, 5, 14),
        initialStrategy: "conservative",
    },
};

export const ValidationErrors: Story = {
    // Validation errors show on click of "Generate Forecast" with empty fields.
    // For Chromatic, we show the empty form — validation requires interaction.
    args: {},
};
