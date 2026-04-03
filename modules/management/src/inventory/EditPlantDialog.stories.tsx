import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within } from "storybook/test";

import { createHouseholdHandlers } from "@packages/api/handlers/household";
import { createManagementPlantHandlers, createManagementCareEventHandlers } from "@packages/api/handlers/management";
import { makePlant, makeCareEvent, makeHousehold, makeHouseholdMember, FAR_PAST, FAR_FUTURE } from "@packages/api/test-utils";

import { EditPlantDialog } from "./EditPlantDialog.tsx";
import { queryDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const defaultHousehold = makeHousehold({ id: "household-1", name: "Our Home" });
const defaultMembers = [
    makeHouseholdMember({ id: "member-1", userId: "user-alice", userName: "Alice", role: "owner" }),
    makeHouseholdMember({ id: "member-2", userId: "user-bob", userName: "Bob" })
];

const householdHandlers = createHouseholdHandlers({ household: defaultHousehold, members: defaultMembers });
const noHouseholdHandlers = createHouseholdHandlers({ household: null, members: [] });

const editPlants = [
    makePlant({ id: "test-edit-1", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-2", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-3", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-4", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-5", name: "Monstera Deliciosa" }),
    makePlant({ id: "test-edit-6", name: "Monstera Deliciosa" })
];

const meta = {
    title: "Management/Inventory/Components/EditPlantDialog",
    component: EditPlantDialog,
    decorators: [queryDecorator, fireflyDecorator],
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
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...noHouseholdHandlers] }
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

export const WithHouseholdSharedOn: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            shared: true
        }),
        _hasHousehold: true
    },
    parameters: {
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...householdHandlers] }
    }
};

export const WithHouseholdSharedOff: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-2",
            name: "Monstera Deliciosa",
            shared: false
        }),
        _hasHousehold: true
    },
    parameters: {
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...householdHandlers] }
    }
};

export const WithoutHousehold: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-3",
            name: "Monstera Deliciosa",
            shared: false
        })
    },
    parameters: {
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...noHouseholdHandlers] }
    }
};

export const SharingToggleOn: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-4",
            name: "Monstera Deliciosa",
            shared: false
        }),
        _hasHousehold: true
    },
    parameters: {
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...householdHandlers] }
    },
    play: async () => {
        const body = within(document.body);
        const toggle = await body.findByRole("switch", { name: "Share with household" });
        await userEvent.click(toggle);
        await waitFor(() => {
            const status = body.getByRole("status");
            if (!status.classList.contains("opacity-100")) {
                throw new Error("Saved indicator not visible yet");
            }
        });
    }
};

export const SharingToggleOff: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-5",
            name: "Monstera Deliciosa",
            shared: true
        }),
        _hasHousehold: true
    },
    parameters: {
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...householdHandlers] }
    },
    play: async () => {
        const body = within(document.body);
        const toggle = await body.findByRole("switch", { name: "Share with household" });
        await userEvent.click(toggle);
        await waitFor(() => {
            const status = body.getByRole("status");
            if (!status.classList.contains("opacity-100")) {
                throw new Error("Saved indicator not visible yet");
            }
        });
    }
};

// --- Care activity stories ---

const careEventsMultiActor = [
    makeCareEvent({ id: "event-1", plantId: "test-edit-1", actorId: "user-alice", actorName: "Alice", timestamp: new Date(2025, 2, 15, 10, 0, 0) }),
    makeCareEvent({ id: "event-2", plantId: "test-edit-1", actorId: "user-bob", actorName: "Bob", timestamp: new Date(2025, 2, 14, 8, 0, 0) }),
    makeCareEvent({ id: "event-3", plantId: "test-edit-1", actorId: "user-alice", actorName: "Alice", timestamp: new Date(2025, 2, 13, 14, 30, 0) })
];

const careEventsSingleActor = [
    makeCareEvent({ id: "event-1", plantId: "test-edit-1", actorId: "user-alice", actorName: "Alice", timestamp: new Date(2025, 2, 15, 10, 0, 0) })
];

export const SharedWithCareActivity: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            shared: true
        }),
        _hasHousehold: true,
        _careEvents: careEventsMultiActor
    },
    parameters: {
        msw: {
            handlers: [...createManagementPlantHandlers(editPlants), ...householdHandlers, ...createManagementCareEventHandlers(careEventsMultiActor)]
        }
    }
};

export const SharedWithSingleCareEvent: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            shared: true
        }),
        _hasHousehold: true,
        _careEvents: careEventsSingleActor
    },
    parameters: {
        msw: {
            handlers: [
                ...createManagementPlantHandlers(editPlants),
                ...householdHandlers,
                ...createManagementCareEventHandlers(careEventsSingleActor)
            ]
        }
    }
};

export const SharedWithNoCareEvents: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            shared: true
        }),
        _hasHousehold: true,
        _careEvents: []
    },
    parameters: {
        msw: { handlers: [...createManagementPlantHandlers(editPlants), ...householdHandlers, ...createManagementCareEventHandlers([])] }
    }
};

export const NonSharedNoCareActivity: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-2",
            name: "Monstera Deliciosa",
            shared: false
        })
    }
};
