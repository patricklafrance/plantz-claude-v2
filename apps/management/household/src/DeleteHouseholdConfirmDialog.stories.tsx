import type { Meta, StoryObj } from "@storybook/react-vite";
import { delay, http, HttpResponse } from "msw";
import { userEvent, within } from "storybook/test";

import { DeleteHouseholdConfirmDialog } from "./DeleteHouseholdConfirmDialog.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const deleteHousehold = {
    id: "household-delete-1",
    name: "Green House",
    ownerId: "user-alice",
    createdAt: new Date(2024, 0, 1)
};

const meta = {
    title: "Management/Household/Components/DeleteHouseholdConfirmDialog",
    component: DeleteHouseholdConfirmDialog,
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
        msw: { handlers: createManagementHouseholdHandlers([deleteHousehold]) }
    },
    args: {
        open: true,
        onOpenChange: () => {}
    }
} satisfies Meta<typeof DeleteHouseholdConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithHousehold: Story = {
    args: {
        household: deleteHousehold
    }
};

export const NullHousehold: Story = {
    args: {
        household: null
    }
};

export const Closed: Story = {
    args: {
        household: deleteHousehold,
        open: false
    }
};

// [interactive] Confirming deletion -> the Delete button shows a loading state.
// Tags exclude this story from the vitest test run: the TanStack DB collection
// may not hydrate before the play function fires in the vitest browser context
// (timing is tighter than in the full Storybook dev server). The story is still
// included in Chromatic visual snapshots and renders correctly in the dev server.
export const DeletingLoadingState: Story = {
    tags: ["!test"],
    args: {
        household: deleteHousehold
    },
    parameters: {
        msw: {
            handlers: [
                ...createManagementHouseholdHandlers([deleteHousehold]),
                http.delete("/api/management/households/:id", async () => {
                    await delay("infinite");

                    return new HttpResponse(null, { status: 204 });
                })
            ]
        }
    },
    play: async ({ canvasElement }) => {
        // The Dialog renders in a portal outside canvasElement, so we must
        // scope queries to document.body to find buttons inside the dialog.
        const body = within(canvasElement.ownerDocument.body);

        const deleteButton = await body.findByRole("button", { name: /^delete$/i });
        await userEvent.click(deleteButton);

        await body.findByText("Deleting...");
    }
};
