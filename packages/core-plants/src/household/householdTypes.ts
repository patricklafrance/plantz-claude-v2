export type HouseholdMemberRole = "owner" | "member";

export type HouseholdMemberStatus = "active" | "invited";

export interface HouseholdMember {
    userId: string;
    userName: string;
    email: string;
    role: HouseholdMemberRole;
    joinedAt: Date;
    status: HouseholdMemberStatus;
}

export interface Household {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    members: HouseholdMember[];
}
