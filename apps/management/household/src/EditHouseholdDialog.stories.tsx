import type { Meta, StoryObj } from "@storybook/react-vite";

import { EditHouseholdDialog } from "./EditHouseholdDialog.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

// The collection must contain the household being edited so the optimistic
// update in `householdCollection.update(id, …)` finds the item.
const editHousehold = {
    id: "household-edit-1",
    name: "Green House",
    ownerId: "user-alice",
    createdAt: new Date(2024, 0, 1)
};

const meta = {
    title: "Management/Household/Components/EditHouseholdDialog",
    component: EditHouseholdDialog,
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
        msw: { handlers: createManagementHouseholdHandlers([editHousehold]) }
    },
    args: {
        open: true,
        onOpenChange: () => {}
    }
} satisfies Meta<typeof EditHouseholdDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] EditHouseholdDialog: shows a form pre-filled with the current household name and Save/Cancel buttons
export const WithHousehold: Story = {
    args: {
        household: editHousehold
    }
};

export const NullHousehold: Story = {
    args: {
        household: null
    }
};

export const Closed: Story = {
    args: {
        household: editHousehold,
        open: false
    }
};
