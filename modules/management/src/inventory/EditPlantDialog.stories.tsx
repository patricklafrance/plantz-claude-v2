import type { Meta, StoryObj } from "@storybook/react-vite";
import { screen, userEvent } from "storybook/test";

import { makePlant, FAR_PAST, FAR_FUTURE, makeHousehold, makeHouseholdMember } from "@packages/core-plants/test-utils";

import { createManagementHouseholdHandlers } from "../household/mocks/createHandlers.ts";
import { EditPlantDialog } from "./EditPlantDialog.tsx";
import { createManagementPlantHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const testHousehold = makeHousehold({
    id: "household-1",
    name: "Plant Family",
    members: [
        makeHouseholdMember({ userId: "user-alice", userName: "Alice", role: "owner" }),
        makeHouseholdMember({ userId: "user-bob", userName: "Bob" })
    ]
});

// The dialog auto-saves via PUT after a 500ms debounce. The collection must
// contain every plant referenced by the stories so the optimistic update in
// `plantsCollection.update(id, …)` finds the item. Without this the debounce
// fires after the collection loads and throws a CollectionOperationError.
const editPlants = [
    makePlant({ id: "test-edit-1", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-2", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-3", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-4", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-5", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-6", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-shared-1", name: "Shared Monstera", householdId: "household-1" }),
    makePlant({ id: "test-edit-shared-2", name: "Shared Monstera", householdId: "household-1" }),
    makePlant({ id: "test-edit-nohousehold-1", name: "Private Monstera" }),
    makePlant({ id: "test-edit-saving-1", name: "Saving Monstera" }),
    makePlant({ id: "test-edit-unshare-1", name: "Unshare Monstera", householdId: "household-1" })
];

const meta = {
    title: "Management/Inventory/Components/EditPlantDialog",
    component: EditPlantDialog,
    decorators: [collectionDecorator, fireflyDecorator],
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
        },
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...createManagementHouseholdHandlers([])] }
    },
    args: {
        open: true,
        onOpenChange: () => {},
        onDelete: () => {}
    }
} satisfies Meta<typeof EditPlantDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPlant: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            description: "A tropical plant with large fenestrated leaves",
            family: "Araceae",
            soilType: "Well-draining mix",
            nextWateringDate: FAR_FUTURE
        })
    }
};

export const MinimalPlant: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-2",
            name: "Monstera Deliciosa"
        })
    }
};

export const AllOptionalFieldsFilled: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-3",
            name: "Monstera Deliciosa",
            description: "Beautiful tropical plant known for its distinctive split leaves and aerial roots. Thrives in indirect light.",
            family: "Araceae",
            soilType: "Peat moss, perlite, and orchid bark mix"
        })
    }
};

export const DueForWatering: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-4",
            name: "Monstera Deliciosa",
            nextWateringDate: FAR_PAST
        })
    }
};

export const MistLeavesFalse: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-5",
            name: "Monstera Deliciosa",
            mistLeaves: false
        })
    }
};

export const LongFieldValues: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-6",
            name: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant Collection Premium Series",
            description:
                "This is an exceptionally rare and beautiful tropical plant that has been carefully cultivated over many generations. Known for its distinctive pinstripe variegation patterns on dark green leaves, it thrives in indirect light conditions and requires consistent moisture without overwatering. Originally native to the tropical forests of South America.",
            family: "Araceae (Philodendron subfamily)",
            soilType: "Premium organic peat moss mixed with perlite, vermiculite, and orchid bark in equal parts",
            wateringQuantity: "250ml slowly poured around the base every 5-7 days"
        })
    }
};

export const WithMarkWatered: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            description: "A tropical plant with large fenestrated leaves",
            nextWateringDate: FAR_PAST
        }),
        onMarkWatered: () => {}
    }
};

export const NullPlant: Story = {
    args: {
        plant: null
    }
};

export const Closed: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa"
        }),
        open: false
    }
};

// --- Sharing control stories ---

export const WithHouseholdSharingOff: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-nohousehold-1",
            name: "Private Monstera"
        })
    },
    parameters: {
        msw: {
            handlers: [...createManagementPlantHandlers(editPlants), ...createManagementHouseholdHandlers([testHousehold])]
        }
    }
};

export const WithHouseholdSharingOn: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-shared-1",
            name: "Shared Monstera",
            householdId: "household-1"
        })
    },
    parameters: {
        msw: {
            handlers: [...createManagementPlantHandlers(editPlants), ...createManagementHouseholdHandlers([testHousehold])]
        }
    }
};

export const SharingSaved: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-saving-1",
            name: "Saving Monstera"
        })
    },
    parameters: {
        msw: {
            handlers: [...createManagementPlantHandlers(editPlants), ...createManagementHouseholdHandlers([testHousehold])]
        }
    },
    play: async () => {
        // Dialog renders in a portal outside canvasElement — use screen.
        // Toggle sharing on — this triggers the debounced auto-save which
        // resolves optimistically and shows the "Saved" confirmation.
        const sharingSwitch = await screen.findByRole("switch", { name: /share with/i }, { timeout: 5000 });
        await userEvent.click(sharingSwitch);
        // Wait for the "Saved" feedback to appear after the optimistic persist resolves
        await screen.findByText("Saved", {}, { timeout: 5000 });
    }
};

export const NoHouseholdNoSharingControl: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa"
        })
    },
    parameters: {
        msw: {
            handlers: [...createManagementPlantHandlers(editPlants), ...createManagementHouseholdHandlers([])]
        }
    }
};

export const UnsharePlant: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-unshare-1",
            name: "Unshare Monstera",
            householdId: "household-1"
        })
    },
    parameters: {
        msw: {
            handlers: [...createManagementPlantHandlers(editPlants), ...createManagementHouseholdHandlers([testHousehold])]
        }
    },
    play: async () => {
        // Dialog renders in a portal outside canvasElement — use screen
        const sharingSwitch = await screen.findByRole("switch", { name: /share with/i }, { timeout: 5000 });
        // Toggle off (currently shared)
        await userEvent.click(sharingSwitch);
    }
};
