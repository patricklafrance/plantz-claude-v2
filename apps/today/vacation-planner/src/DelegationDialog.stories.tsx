import type { Meta, StoryObj } from "@storybook/react-vite";

import { DelegationDialog } from "./DelegationDialog.tsx";

const TRIP_START = new Date(2099, 5, 1);
const TRIP_END = new Date(2099, 5, 14);

const meta = {
    title: "Today/VacationPlanner/Components/DelegationDialog",
    component: DelegationDialog,
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
        open: true,
        onOpenChange: () => {},
        plantName: "Boston Fern",
        tripStartDate: TRIP_START,
        tripEndDate: TRIP_END,
        onSave: () => {},
    },
} satisfies Meta<typeof DelegationDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExistingDelegation: Story = {
    args: {
        existingDelegation: {
            helperName: "Alice",
            wateringDate: new Date(2099, 5, 7),
            notes: "Water in the morning, use filtered water",
        },
    },
};

export const ValidationErrors: Story = {
    // The validation errors show when the user clicks Save with empty fields.
    // For Chromatic, we show the dialog open — validation errors require interaction.
    args: {
        open: true,
    },
};
