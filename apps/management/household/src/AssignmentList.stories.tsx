import type { Meta, StoryObj } from "@storybook/react-vite";

import { AssignmentList } from "./AssignmentList.tsx";

const SEED_ASSIGNMENTS = [
    {
        id: "h1-plant-1",
        householdId: "household-1",
        plantId: "plant-1",
        plantName: "Monstera Deliciosa",
        assignmentType: "fixed" as const,
        assignedUserId: "user-alice",
        assignedMemberName: "Alice"
    },
    {
        id: "h1-plant-2",
        householdId: "household-1",
        plantId: "plant-2",
        plantName: "Fiddle Leaf Fig",
        assignmentType: "rotating" as const,
        assignedUserId: undefined,
        assignedMemberName: undefined
    },
    {
        id: "h1-plant-3",
        householdId: "household-1",
        plantId: "plant-3",
        plantName: "Snake Plant",
        assignmentType: "unassigned" as const,
        assignedUserId: undefined,
        assignedMemberName: undefined
    }
];

const meta = {
    title: "Management/Household/Components/AssignmentList",
    component: AssignmentList,
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
} satisfies Meta<typeof AssignmentList>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] AssignmentList: Shows a table of shared plants with columns for plant name, assignment type, and assigned member
// "Fixed" assignments show the member name; "Rotating" shows "Rotating"; "Unassigned" shows "Anyone"
export const WithMixedAssignments: Story = {
    args: {
        assignments: SEED_ASSIGNMENTS,
        onEdit: () => {}
    }
};

// [visual] AssignmentList: Empty state
export const Empty: Story = {
    args: {
        assignments: [],
        onEdit: () => {}
    }
};

// [visual] AssignmentList: Single fixed assignment
export const SingleFixed: Story = {
    args: {
        assignments: [SEED_ASSIGNMENTS[0]],
        onEdit: () => {}
    }
};
