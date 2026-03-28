import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, waitFor } from "storybook/test";

import { HouseholdPage } from "./HouseholdPage.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const SEED_HOUSEHOLD = {
    id: "household-1",
    name: "Green House",
    ownerId: "user-alice",
    createdAt: new Date(2024, 0, 1)
};

const meta = {
    title: "Management/Household/Pages/HouseholdPage",
    component: HouseholdPage,
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
} satisfies Meta<typeof HouseholdPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] HouseholdPage (empty state): shows "You don't have a household yet" with Create button
export const Empty: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([]) }
    }
};

// [visual] HouseholdPage (with household): shows name, creation date, edit and delete buttons
export const WithHousehold: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD]) }
    }
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers("loading") }
    }
};

// [interactive] After creating a household -> the HouseholdPage displays the newly created household
export const AfterCreate: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Dialogs render in a portal outside canvasElement — scope those queries to body
        const body = within(canvasElement.ownerDocument.body);

        const createButton = await canvas.findByRole("button", { name: /create household/i });
        await userEvent.click(createButton);

        const nameInput = await body.findByLabelText(/name \*/i);
        await userEvent.type(nameInput, "New Household");

        // Wait for the Create button to become enabled after typing
        const submitButton = await body.findByRole("button", { name: /^create$/i });
        await waitFor(() => {
            if ((submitButton as HTMLButtonElement).disabled) {
                throw new Error("Create button is still disabled");
            }
        });
        await userEvent.click(submitButton);

        await canvas.findByText("New Household");
    }
};

// [interactive] After editing -> the HouseholdPage displays the updated household name
export const AfterEdit: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Dialogs render in a portal outside canvasElement — scope those queries to body
        const body = within(canvasElement.ownerDocument.body);

        const editButton = await canvas.findByRole("button", { name: /edit green house/i });
        await userEvent.click(editButton);

        const nameInput = await body.findByLabelText(/name \*/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Updated House");

        // Wait for the Save button to become enabled
        const saveButton = await body.findByRole("button", { name: /^save$/i });
        await waitFor(() => {
            if ((saveButton as HTMLButtonElement).disabled) {
                throw new Error("Save button is still disabled");
            }
        });
        await userEvent.click(saveButton);

        await canvas.findByText("Updated House");
    }
};

// [interactive] After deleting -> the HouseholdPage shows the empty state
export const AfterDelete: Story = {
    parameters: {
        msw: { handlers: createManagementHouseholdHandlers([SEED_HOUSEHOLD]) }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Dialogs render in a portal outside canvasElement — scope those queries to body
        const body = within(canvasElement.ownerDocument.body);

        const deleteButton = await canvas.findByRole("button", { name: /delete green house/i });
        await userEvent.click(deleteButton);

        const confirmButton = await body.findByRole("button", { name: /^delete$/i });
        await userEvent.click(confirmButton);

        await canvas.findByText(/you don't have a household yet/i);
    }
};
