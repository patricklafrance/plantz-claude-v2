import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse, delay } from "msw";
import { userEvent, within } from "storybook/test";

import { EditAssignmentDialog } from "./EditAssignmentDialog.tsx";
import { fireflyDecorator } from "./storybook.setup.tsx";

const SEED_MEMBERS = [
    { id: "member-alice", userId: "user-alice", name: "Alice" },
    { id: "member-bob", userId: "user-bob", name: "Bob" }
];

const FIXED_ASSIGNMENT = {
    id: "h1-plant-1",
    householdId: "household-1",
    plantId: "plant-1",
    plantName: "Monstera Deliciosa",
    assignmentType: "fixed" as const,
    assignedUserId: "user-alice",
    assignedMemberName: "Alice"
};

const ROTATING_ASSIGNMENT = {
    id: "h1-plant-2",
    householdId: "household-1",
    plantId: "plant-2",
    plantName: "Fiddle Leaf Fig",
    assignmentType: "rotating" as const,
    assignedUserId: undefined,
    assignedMemberName: undefined
};

const UNASSIGNED_ASSIGNMENT = {
    id: "h1-plant-3",
    householdId: "household-1",
    plantId: "plant-3",
    plantName: "Snake Plant",
    assignmentType: "unassigned" as const,
    assignedUserId: undefined,
    assignedMemberName: undefined
};

const successHandler = http.put("/api/management/households/:id/assignments/:plantId", async ({ request }) => {
    const body = (await request.json()) as { assignmentType: string; assignedUserId?: string };
    return HttpResponse.json({ assignmentType: body.assignmentType, assignedUserId: body.assignedUserId });
});

const meta = {
    title: "Management/Household/Components/EditAssignmentDialog",
    component: EditAssignmentDialog,
    decorators: [fireflyDecorator],
    args: {
        householdId: "household-1",
        members: SEED_MEMBERS,
        open: true,
        onOpenChange: () => {},
        onSaved: () => {}
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
        msw: { handlers: [successHandler] }
    }
} satisfies Meta<typeof EditAssignmentDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] EditAssignmentDialog: Shows a radio group for assignment type (Fixed, Rotating, Unassigned)
// When "Fixed" is selected, a member select dropdown appears
export const FixedWithMemberSelect: Story = {
    args: { assignment: FIXED_ASSIGNMENT }
};

// [visual] EditAssignmentDialog: Rotating assignment
export const Rotating: Story = {
    args: { assignment: ROTATING_ASSIGNMENT }
};

// [visual] EditAssignmentDialog: Unassigned
export const Unassigned: Story = {
    args: { assignment: UNASSIGNED_ASSIGNMENT }
};

// [interactive] Selecting "Fixed" shows the member select dropdown
export const SelectingFixed: Story = {
    args: { assignment: UNASSIGNED_ASSIGNMENT },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);
        const fixedRadio = await body.findByRole("radio", { name: /fixed/i });
        await userEvent.click(fixedRadio);
    }
};

// [interactive] Saving a fixed assignment — shows loading state
export const SavingFixed: Story = {
    args: { assignment: UNASSIGNED_ASSIGNMENT },
    parameters: {
        msw: {
            handlers: [
                http.put("/api/management/households/:id/assignments/:plantId", async () => {
                    await delay("infinite");
                    return HttpResponse.json({});
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);
        const fixedRadio = await body.findByRole("radio", { name: /fixed/i });
        await userEvent.click(fixedRadio);

        // Select a member
        const memberSelect = await body.findByRole("combobox");
        await userEvent.click(memberSelect);
        const aliceOption = await body.findByRole("option", { name: /alice/i });
        await userEvent.click(aliceOption);

        const saveButton = await body.findByRole("button", { name: /^save$/i });
        await userEvent.click(saveButton);

        // Should show loading state
        await body.findByRole("button", { name: /saving/i });
    }
};
