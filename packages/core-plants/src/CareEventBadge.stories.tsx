import type { Meta, StoryObj } from "@storybook/react-vite";

import { CareEventBadge } from "./CareEventBadge.tsx";

const meta = {
    title: "Packages/CorePlants/Components/CareEventBadge",
    component: CareEventBadge,
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
} satisfies Meta<typeof CareEventBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Watered: Story = {
    args: {
        eventType: "watered",
    },
};

export const Skipped: Story = {
    args: {
        eventType: "skipped",
    },
};

export const Delegated: Story = {
    args: {
        eventType: "delegated",
    },
};
