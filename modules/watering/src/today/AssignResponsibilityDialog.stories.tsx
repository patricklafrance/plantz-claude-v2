import type { Meta, StoryObj } from "@storybook/react-vite";
import { screen, userEvent, within, fn } from "storybook/test";

import { makeHouseholdMember } from "@packages/core-plants/test-utils";

import { AssignResponsibilityDialog } from "./AssignResponsibilityDialog.tsx";
import { fireflyDecorator } from "./storybook.setup.tsx";

const members = [
    makeHouseholdMember({ userId: "user-alice", userName: "Alice", role: "owner" }),
    makeHouseholdMember({ userId: "user-bob", userName: "Bob" }),
    makeHouseholdMember({ userId: "user-carol", userName: "Carol" })
];

const meta = {
    title: "Watering/Today/Components/AssignResponsibilityDialog",
    component: AssignResponsibilityDialog,
    decorators: [fireflyDecorator],
    args: {
        plantName: "Boston Fern",
        open: true,
        onOpenChange: fn(),
        members,
        onSave: fn()
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
        }
    }
} satisfies Meta<typeof AssignResponsibilityDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default state: dialog open with unassigned strategy selected
export const Default: Story = {};

// With an existing fixed assignment
export const WithExistingFixedAssignment: Story = {
    args: {
        currentAssignment: {
            id: "assign-1",
            plantId: "plant-1",
            strategy: "fixed",
            assignedUserId: "user-bob",
            assignedUserName: "Bob"
        }
    }
};

// With an existing rotating assignment
export const WithExistingRotatingAssignment: Story = {
    args: {
        currentAssignment: {
            id: "assign-2",
            plantId: "plant-1",
            strategy: "rotating",
            lastRotatedAt: new Date(2024, 9, 1)
        }
    }
};

// Strategy changed to fixed, member dropdown visible
export const FixedStrategyWithMemberDropdown: Story = {
    play: async ({ canvasElement }) => {
        // Wait for the dialog to render via portal
        await screen.findByRole("dialog");
        const dialog = screen.getByRole("dialog");
        const dialogScope = within(dialog);

        // Click the strategy selector and choose "Fixed"
        const strategyTrigger = dialogScope.getByLabelText("Strategy");
        await userEvent.click(strategyTrigger);

        // Select "Fixed" from the portal dropdown
        const fixedOption = await screen.findByRole("option", { name: /fixed/i });
        await userEvent.click(fixedOption);
    }
};

// Saving state: loading spinner on save button
export const SavingState: Story = {
    args: {
        onSave: fn(() => new Promise<void>(() => {})) // Never resolves to keep loading state
    },
    play: async ({ canvasElement }) => {
        await screen.findByRole("dialog");
        const dialog = screen.getByRole("dialog");
        const dialogScope = within(dialog);

        // Click Save (unassigned is default, so Save is enabled)
        const saveButton = dialogScope.getByRole("button", { name: /save/i });
        await userEvent.click(saveButton);

        // The button should now show "Saving..."
        await screen.findByText("Saving...");
    }
};
