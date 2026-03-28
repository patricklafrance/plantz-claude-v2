import type { Meta, StoryObj } from "@storybook/react-vite";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Management/Household/Components/CreateHouseholdDialog",
    component: CreateHouseholdDialog,
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
        msw: { handlers: createManagementHouseholdHandlers([]) }
    },
    args: {
        open: true,
        onOpenChange: () => {}
    }
} satisfies Meta<typeof CreateHouseholdDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] CreateHouseholdDialog: shows a form with a name input field and Create/Cancel buttons
export const Open: Story = {};

export const Closed: Story = {
    args: { open: false }
};
