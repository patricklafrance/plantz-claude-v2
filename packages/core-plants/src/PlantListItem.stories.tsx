import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlantListHeader } from "./PlantListHeader.tsx";
import { PlantListItem } from "./PlantListItem.tsx";
import type { Plant } from "./plantSchema.ts";

// Extreme dates ensure isDueForWatering() returns a deterministic result
// regardless of when the snapshot runs — no Date freeze needed.
const FAR_FUTURE = new Date(2099, 0, 1, 0, 0, 0, 0);
const FAR_PAST = new Date(2020, 0, 1, 0, 0, 0, 0);
const FIXED_CREATION = new Date(2025, 0, 1, 0, 0, 0, 0);

function makePlant(overrides: Partial<Plant> = {}): Plant {
    return {
        id: "test-1",
        userId: "user-alice",
        name: "Monstera Deliciosa",
        description: "A tropical plant",
        family: "Araceae",
        location: "living-room",
        luminosity: "medium",
        mistLeaves: true,
        soilType: "Well-draining mix",
        wateringFrequency: "1-week",
        wateringQuantity: "200ml",
        wateringType: "surface",
        nextWateringDate: FAR_FUTURE,
        creationDate: FIXED_CREATION,
        lastUpdateDate: FIXED_CREATION,
        ...overrides,
    };
}

const meta = {
    title: "Packages/CorePlants/Components/PlantListItem",
    component: PlantListItem,
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
        selected: false,
        onToggleSelect: () => {},
        onEdit: () => {},
        onDelete: () => {},
    },
    decorators: [
        (Story) => (
            <div className="border-border w-full max-w-[1200px] rounded-lg border">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PlantListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        plant: makePlant(),
    },
};

export const Selected: Story = {
    args: {
        plant: makePlant(),
        selected: true,
    },
};

export const DueForWatering: Story = {
    args: {
        plant: makePlant({ nextWateringDate: FAR_PAST }),
    },
};

export const DueAndSelected: Story = {
    args: {
        plant: makePlant({ nextWateringDate: FAR_PAST }),
        selected: true,
    },
};

export const LongName: Story = {
    args: {
        plant: makePlant({
            name: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant Collection",
        }),
    },
};

export const LongFieldValues: Story = {
    args: {
        plant: makePlant({
            wateringQuantity: "500ml every other day when soil is dry",
            wateringType: "deep",
            location: "bathroom",
        }),
    },
};

export const MinimalFields: Story = {
    args: {
        plant: makePlant({
            description: undefined,
            family: undefined,
            soilType: undefined,
        }),
    },
};

export const NoEditButton: Story = {
    args: {
        plant: makePlant(),
        onEdit: undefined,
    },
};

export const NoDeleteButton: Story = {
    args: {
        plant: makePlant(),
        onDelete: undefined,
    },
};

export const NoSelectionNoDelete: Story = {
    args: {
        plant: makePlant(),
        onToggleSelect: undefined,
        onDelete: undefined,
        selected: undefined,
    },
};

export const ClickOnly: Story = {
    args: {
        plant: makePlant(),
        onClick: () => {},
        onToggleSelect: undefined,
        onEdit: undefined,
        onDelete: undefined,
        selected: undefined,
    },
};

export const DueWithMarkWatered: Story = {
    args: {
        plant: makePlant({ nextWateringDate: FAR_PAST }),
        onMarkWatered: () => {},
    },
};

export const NotDueWithMarkWatered: Story = {
    args: {
        plant: makePlant({ nextWateringDate: FAR_FUTURE }),
        onMarkWatered: () => {},
    },
};

export const MistLeavesFalse: Story = {
    args: {
        plant: makePlant({ mistLeaves: false }),
    },
};

export const WithHeader: Story = {
    args: {
        plant: makePlant(),
    },
    render: (args) => (
        <div>
            <PlantListHeader showCheckbox showActions />
            <PlantListItem {...args} />
        </div>
    ),
};
