export interface Household {
    id: string;
    name: string;
    createdBy: string;
    creationDate: Date;
}

export interface HouseholdMember {
    id: string;
    householdId: string;
    userId: string;
    userName: string;
    role: "owner" | "member";
    joinDate: Date;
}

export function parseHousehold(data: Record<string, unknown>): Household {
    return {
        ...data,
        creationDate: new Date(data.creationDate as string)
    } as Household;
}

export function parseHouseholdMember(data: Record<string, unknown>): HouseholdMember {
    return {
        ...data,
        joinDate: new Date(data.joinDate as string)
    } as HouseholdMember;
}
