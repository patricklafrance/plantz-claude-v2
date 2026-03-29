import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/core-plants/test-utils";

import { createManagementPlantHandlers } from "./mocks/index.ts";
import { PlantsPage } from "./PlantsPage.tsx";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Management/Plants/Pages/PlantsPage",
    component: PlantsPage,
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
        }
    }
} satisfies Meta<typeof PlantsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Representative mix: some due, some not, various locations and properties
export const Default: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers([
                makePlant({
                    id: "p-1",
                    name: "Aloe Vera",
                    family: "Asphodelaceae",
                    location: "kitchen",
                    luminosity: "high",
                    nextWateringDate: FAR_PAST
                }),
                makePlant({
                    id: "p-2",
                    name: "Boston Fern",
                    family: "Nephrolepidaceae",
                    location: "bathroom",
                    luminosity: "medium",
                    nextWateringDate: FAR_FUTURE
                }),
                makePlant({
                    id: "p-3",
                    name: "Calathea Orbifolia",
                    family: "Marantaceae",
                    location: "living-room",
                    luminosity: "low",
                    nextWateringDate: FAR_PAST
                }),
                makePlant({
                    id: "p-4",
                    name: "Dracaena Marginata",
                    family: "Asparagaceae",
                    location: "bedroom",
                    luminosity: "medium",
                    nextWateringDate: FAR_FUTURE
                }),
                makePlant({ id: "p-5", name: "English Ivy", family: "Araliaceae", location: "dining-room", nextWateringDate: FAR_PAST }),
                makePlant({
                    id: "p-6",
                    name: "Fiddle Leaf Fig",
                    family: "Moraceae",
                    location: "living-room",
                    luminosity: "high",
                    nextWateringDate: FAR_FUTURE
                }),
                makePlant({
                    id: "p-7",
                    name: "Golden Barrel Cactus",
                    family: "Cactaceae",
                    location: "basement",
                    luminosity: "high",
                    mistLeaves: false,
                    nextWateringDate: FAR_FUTURE
                }),
                makePlant({ id: "p-8", name: "Hoya Carnosa", family: "Apocynaceae", location: "bedroom", nextWateringDate: FAR_PAST }),
                makePlant({
                    id: "p-9",
                    name: "Jade Plant",
                    family: "Crassulaceae",
                    location: "kitchen",
                    luminosity: "high",
                    mistLeaves: false,
                    nextWateringDate: FAR_FUTURE
                }),
                makePlant({ id: "p-10", name: "Kentia Palm", family: "Arecaceae", location: "living-room", nextWateringDate: FAR_FUTURE })
            ])
        }
    }
};

export const Empty: Story = {
    parameters: {
        msw: { handlers: createManagementPlantHandlers([]) }
    }
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers([
                makePlant({
                    id: "single-1",
                    name: "Monstera Deliciosa",
                    description: "A tropical plant with large fenestrated leaves.",
                    family: "Araceae"
                })
            ])
        }
    }
};

export const ManyDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-3", name: "Calathea Orbifolia", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-4", name: "Dracaena Marginata", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-6", name: "Fiddle Leaf Fig", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-7", name: "Golden Barrel Cactus", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-8", name: "Hoya Carnosa", nextWateringDate: FAR_PAST })
            ])
        }
    }
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createManagementPlantHandlers("loading") }
    }
};

// --- Sharing stories ---

const sharedPlants = [
    makePlant({ id: "sp-1", name: "Aloe Vera", householdId: "household-1", nextWateringDate: FAR_PAST }),
    makePlant({ id: "sp-2", name: "Boston Fern", householdId: "household-1", nextWateringDate: FAR_FUTURE }),
    makePlant({ id: "sp-3", name: "Calathea Orbifolia", nextWateringDate: FAR_FUTURE }),
    makePlant({ id: "sp-4", name: "Dracaena Marginata", nextWateringDate: FAR_FUTURE }),
    makePlant({ id: "sp-5", name: "English Ivy", householdId: "household-1", nextWateringDate: FAR_FUTURE })
];

export const WithSharedPlants: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers(sharedPlants, { householdId: "household-1" })
        }
    }
};

export const ShareLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers(sharedPlants, {
                householdId: "household-1",
                shareDelay: "infinite"
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const shareButton = await canvas.findByLabelText("Share Calathea Orbifolia");
        await userEvent.click(shareButton);
    }
};

export const AfterShare: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers(sharedPlants, { householdId: "household-1" })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const shareButton = await canvas.findByLabelText("Share Calathea Orbifolia");
        await userEvent.click(shareButton);
        // Wait for the shared indicator to appear — findByLabelText retries until found
        await canvas.findByLabelText("Unshare Calathea Orbifolia");
    }
};

export const UnshareLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers(sharedPlants, {
                householdId: "household-1",
                shareDelay: "infinite"
            })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const unshareButton = await canvas.findByLabelText("Unshare Aloe Vera");
        await userEvent.click(unshareButton);
    }
};

export const AfterUnshare: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers(sharedPlants, { householdId: "household-1" })
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const unshareButton = await canvas.findByLabelText("Unshare Aloe Vera");
        await userEvent.click(unshareButton);
        // Wait for the share button to appear after unsharing
        await canvas.findByLabelText("Share Aloe Vera");
    }
};

export const NoHousehold: Story = {
    parameters: {
        msw: {
            handlers: createManagementPlantHandlers(sharedPlants, { householdId: null })
        }
    }
};
