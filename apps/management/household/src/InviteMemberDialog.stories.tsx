import type { Meta, StoryObj } from "@storybook/react-vite";
import { screen, userEvent, within } from "storybook/test";

import { InviteMemberDialog } from "./InviteMemberDialog.tsx";
import { createManagementHouseholdHandlers } from "./mocks/createHandlers.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Management/Household/Components/InviteMemberDialog",
    component: InviteMemberDialog,
    decorators: [collectionDecorator, fireflyDecorator],
    args: {
        open: true,
        onOpenChange: () => {},
        householdId: "h-1",
        onInviteSent: () => {}
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
} satisfies Meta<typeof InviteMemberDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] Default open state showing the email field
export const Default: Story = {};

// [interactive] Submitting without an email shows a validation message
export const WithValidationError: Story = {
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const submitButton = await within(dialog).findByRole("button", { name: /send invite/i });
        await userEvent.click(submitButton);
    }
};

// [interactive] After typing an email, the submit button is ready
export const WithEmailFilled: Story = {
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const emailInput = await within(dialog).findByLabelText(/email/i);
        await userEvent.type(emailInput, "bob@example.com");
    }
};

// [interactive] Submitting the invite dialog shows a loading indicator on the submit button
export const WithSubmitLoading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [], inviteResult: "loading" })
        }
    },
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const emailInput = await within(dialog).findByLabelText(/email/i);
        await userEvent.type(emailInput, "bob@example.com");
        const submitButton = await within(dialog).findByRole("button", { name: /send invite/i });
        await userEvent.click(submitButton);
        await within(dialog).findByText("Sending...");
    }
};

// [interactive] Inviting an email that does not match a known user shows a validation message
export const WithUserNotFound: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({ households: [], inviteResult: "user-not-found" })
        }
    },
    play: async () => {
        const dialog = await screen.findByRole("dialog");
        const emailInput = await within(dialog).findByLabelText(/email/i);
        await userEvent.type(emailInput, "unknown@example.com");
        const submitButton = await within(dialog).findByRole("button", { name: /send invite/i });
        await userEvent.click(submitButton);
        await within(dialog).findByText("User not found");
    }
};
