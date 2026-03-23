import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlantListHeader } from "./PlantListHeader.tsx";

const meta = {
    title: "Packages/CorePlants/Components/PlantListHeader",
    component: PlantListHeader,
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
            <div className="border-border w-full max-w-[1200px] rounded-lg border">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PlantListHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCheckbox: Story = {
    args: {
        selectAllChecked: false,
        onToggleSelectAll: () => {},
    },
};

export const WithCheckboxChecked: Story = {
    args: {
        selectAllChecked: true,
        onToggleSelectAll: () => {},
    },
};

export const WithActions: Story = {
    args: {
        showActions: true,
    },
};

export const WithCheckboxAndActions: Story = {
    args: {
        showActions: true,
        selectAllChecked: false,
        onToggleSelectAll: () => {},
    },
};
