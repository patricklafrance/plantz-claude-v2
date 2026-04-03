import type { Meta, StoryObj } from "@storybook/react-vite";

import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/api/test-utils";

import { PlantListItem } from "./PlantListItem.tsx";

const meta = {
    title: "Management/Inventory/Components/PlantListItem",
    component: PlantListItem,
    parameters: {
        chromatic: {
            modes: {
                "light mobile": { theme: "light", viewport: 375 },
                "light tablet": { theme: "light", viewport: 768 },
                "light desktop": { theme: "light", viewport: 1280 },
                "dark mobile": { theme: "dark", viewport: 375 },
                "dark tablet": { theme: "dark", viewport: 768 },
                "dark desktop": { theme: "dark", viewport: 1280 }
            }
        }
    },
    args: {
        onEdit: () => {},
        onDelete: () => {},
        onMarkWatered: () => {}
    }
} satisfies Meta<typeof PlantListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        plant: makePlant({
            id: "p-1",
            name: "Monstera Deliciosa",
            nextWateringDate: FAR_FUTURE
        })
    }
};

export const SharedPlant: Story = {
    args: {
        plant: makePlant({
            id: "p-2",
            name: "Fiddle Leaf Fig",
            shared: true,
            nextWateringDate: FAR_FUTURE
        })
    }
};

export const NotSharedPlant: Story = {
    args: {
        plant: makePlant({
            id: "p-3",
            name: "Snake Plant",
            shared: false,
            nextWateringDate: FAR_FUTURE
        })
    }
};

export const SharedAndDue: Story = {
    args: {
        plant: makePlant({
            id: "p-4",
            name: "Peace Lily",
            shared: true,
            nextWateringDate: FAR_PAST
        })
    }
};

export const DueForWatering: Story = {
    args: {
        plant: makePlant({
            id: "p-5",
            name: "Pothos",
            nextWateringDate: FAR_PAST
        })
    }
};

export const Selected: Story = {
    args: {
        plant: makePlant({
            id: "p-6",
            name: "Spider Plant",
            nextWateringDate: FAR_FUTURE
        }),
        selected: true,
        onToggleSelect: () => {}
    }
};

export const WithMistLeaves: Story = {
    args: {
        plant: makePlant({
            id: "p-7",
            name: "Calathea",
            mistLeaves: true,
            nextWateringDate: FAR_FUTURE
        })
    }
};

export const LongName: Story = {
    args: {
        plant: makePlant({
            id: "p-8",
            name: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant",
            shared: true,
            nextWateringDate: FAR_FUTURE
        })
    }
};
