import type { Meta, StoryObj } from "@storybook/react-vite";
import { screen, userEvent, within } from "storybook/test";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { createManagementHouseholdHandlers } from "./mocks/createHandlers.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Management/Household/Components/CreateHouseholdDialog",
    component: CreateHouseholdDialog,
    decorators: [collectionDecorator, fireflyDecorator],
    args: {
        open: true,
        onOpenChange: () => {}
    },
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
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [] })
        }
    }
} satisfies Meta<typeof CreateHouseholdDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default open state showing the name field
export const Default: Story = {};

// [interactive] Submitting without a name shows a validation message
export const WithValidationError: Story = {
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const submitButton = await within(dialog).findByRole("button", { name: /create household/i });
        await userEvent.click(submitButton);
    }
};

// [interactive] After typing a name, the submit button is ready
export const WithNameFilled: Story = {
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const nameInput = await within(dialog).findByLabelText(/name/i);
        await userEvent.type(nameInput, "The Green House");
    }
};

// [interactive] Submitting the create dialog with a valid name shows a loading indicator on the submit button
export const WithSubmitLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [], postDelay: "infinite" })
        }
    },
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const nameInput = await within(dialog).findByLabelText(/name/i);
        await userEvent.type(nameInput, "The Green House");
        const submitButton = await within(dialog).findByRole("button", { name: /create household/i });
        await userEvent.click(submitButton);
        // After clicking, the button should show "Creating..." with a loading spinner
        await within(dialog).findByText("Creating...");
    }
};
