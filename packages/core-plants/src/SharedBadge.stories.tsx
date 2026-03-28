import type { Meta, StoryObj } from "@storybook/react-vite";

import { SharedBadge } from "./SharedBadge.tsx";

const meta = {
    title: "Packages/CorePlants/Components/SharedBadge",
    component: SharedBadge,
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
} satisfies Meta<typeof SharedBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
