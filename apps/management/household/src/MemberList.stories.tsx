import type { Meta, StoryObj } from "@storybook/react-vite";

import type { MemberRow } from "./MemberList.tsx";
import { MemberList } from "./MemberList.tsx";

const ALICE: MemberRow = {
    id: "member-alice",
    name: "Alice",
    email: "alice@example.com",
    joinedAt: new Date(2025, 0, 1),
    isOwner: true
};

const BOB: MemberRow = {
    id: "member-bob",
    name: "Bob",
    email: "bob@example.com",
    joinedAt: new Date(2025, 0, 15),
    isOwner: false
};

const CHARLIE: MemberRow = {
    id: "member-charlie",
    name: "Charlie",
    email: "charlie@example.com",
    joinedAt: new Date(2025, 1, 3),
    isOwner: false
};

const meta = {
    title: "Management/Household/Components/MemberList",
    component: MemberList,
    args: {
        onRemove: () => {}
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
} satisfies Meta<typeof MemberList>;

export default meta;

type Story = StoryObj<typeof meta>;

// [visual] MemberList: Shows a list of members with name, email, and join date columns.
// The household owner is visually distinguished with an "Owner" label.
// Each non-owner member row has a "Remove" action.
export const WithMembers: Story = {
    args: {
        members: [ALICE, BOB, CHARLIE]
    }
};

// [visual] MemberList: Single owner — no Remove action rendered.
export const SingleOwner: Story = {
    args: {
        members: [ALICE]
    }
};

export const Empty: Story = {
    args: {
        members: []
    }
};
