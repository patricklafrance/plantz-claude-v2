import type { Meta, StoryObj } from "@storybook/react-vite";

import { ResponsibilityBadge } from "./ResponsibilityBadge.tsx";

const meta = {
    title: "Today/LandingPage/Components/ResponsibilityBadge",
    component: ResponsibilityBadge,
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
    decorators: [
        Story => (
            <div className="flex items-center gap-2 p-4">
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof ResponsibilityBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

const MEMBER_MAP = new Map([
    ["user-alice", "Alice"],
    ["user-bob", "Bob"]
]);

// Fixed assignment assigned to the current user → shows "Yours"
export const Yours: Story = {
    args: {
        assignment: {
            id: "assign-1",
            householdId: "household-green-house",
            plantId: "plant-1",
            assignmentType: "fixed",
            assignedUserId: "user-alice"
        },
        currentUserId: "user-alice",
        memberNameMap: MEMBER_MAP
    }
};

// Fixed assignment assigned to another member → shows their name
export const AnotherMember: Story = {
    args: {
        assignment: {
            id: "assign-2",
            householdId: "household-green-house",
            plantId: "plant-2",
            assignmentType: "fixed",
            assignedUserId: "user-bob"
        },
        currentUserId: "user-alice",
        memberNameMap: MEMBER_MAP
    }
};

// Unassigned → shows "Anyone"
export const Anyone: Story = {
    args: {
        assignment: {
            id: "assign-3",
            householdId: "household-green-house",
            plantId: "plant-3",
            assignmentType: "unassigned"
        },
        currentUserId: "user-alice",
        memberNameMap: MEMBER_MAP
    }
};

// Rotating assignment (no assignedUserId) → shows "Anyone"
export const Rotating: Story = {
    args: {
        assignment: {
            id: "assign-4",
            householdId: "household-green-house",
            plantId: "plant-4",
            assignmentType: "rotating"
        },
        currentUserId: "user-alice",
        memberNameMap: MEMBER_MAP
    }
};

// Fixed to a user whose name is not in the member map → shows "Someone's"
export const UnknownMember: Story = {
    args: {
        assignment: {
            id: "assign-5",
            householdId: "household-green-house",
            plantId: "plant-5",
            assignmentType: "fixed",
            assignedUserId: "user-charlie"
        },
        currentUserId: "user-alice",
        memberNameMap: MEMBER_MAP
    }
};
