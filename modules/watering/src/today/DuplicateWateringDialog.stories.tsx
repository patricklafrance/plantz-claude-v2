import type { Meta, StoryObj } from "@storybook/react-vite";

import { DuplicateWateringDialog } from "./DuplicateWateringDialog.tsx";

const meta = {
    title: "Watering/Today/Components/DuplicateWateringDialog",
    component: DuplicateWateringDialog,
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
    },
    args: {
        open: true,
        onConfirm: () => {},
        onCancel: () => {}
    }
} satisfies Meta<typeof DuplicateWateringDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// Use a fixed date 2 hours in the past for deterministic display
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

export const Default: Story = {
    args: {
        actorName: "Alex",
        wateredAt: twoHoursAgo
    }
};

// Recently watered (minutes ago)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

export const RecentlyWatered: Story = {
    args: {
        actorName: "Bob",
        wateredAt: fiveMinutesAgo
    }
};

// Watered a day ago
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

export const WateredYesterday: Story = {
    args: {
        actorName: "Carol",
        wateredAt: oneDayAgo
    }
};
