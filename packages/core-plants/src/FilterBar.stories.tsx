import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterBar } from "./FilterBar.tsx";
import type { PlantFilters } from "./usePlantFilters.ts";

const defaultFilters: PlantFilters = {
    name: "",
    location: null,
    luminosity: null,
    mistLeaves: null,
    soilType: "",
    wateringFrequency: null,
    wateringType: null,
    dueForWatering: false,
};

const meta = {
    title: "Packages/CorePlants/Components/FilterBar",
    component: FilterBar,
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
        filters: defaultFilters,
        onFilterChange: () => {},
        onClear: () => {},
        hasActiveFilters: false,
    },
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNameFilter: Story = {
    args: {
        filters: { ...defaultFilters, name: "Monstera" },
        hasActiveFilters: true,
    },
};

export const WithLocationSelected: Story = {
    args: {
        filters: { ...defaultFilters, location: "living-room" },
        hasActiveFilters: true,
    },
};

export const MultipleFiltersActive: Story = {
    args: {
        filters: {
            ...defaultFilters,
            name: "Fern",
            location: "bedroom",
            luminosity: "bright-indirect",
            mistLeaves: true,
            dueForWatering: true,
        },
        hasActiveFilters: true,
    },
};

export const HideDueForWatering: Story = {
    args: {
        showDueForWatering: false,
    },
};
