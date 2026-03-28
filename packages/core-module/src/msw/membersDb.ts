import type { HouseholdMember } from "../householdMemberSchema.ts";

class MembersDb {
    #members: HouseholdMember[] = [
        { id: "member-alice-green-house", householdId: "household-green-house", userId: "user-alice", joinedAt: new Date(2025, 0, 1) },
        { id: "member-bob-green-house", householdId: "household-green-house", userId: "user-bob", joinedAt: new Date(2025, 0, 15) }
    ];

    getAll(): HouseholdMember[] {
        return [...this.#members];
    }

    getByHousehold(householdId: string): HouseholdMember[] {
        return this.#members.filter(m => m.householdId === householdId);
    }

    getByUser(userId: string): HouseholdMember[] {
        return this.#members.filter(m => m.userId === userId);
    }
}

export const membersDb = new MembersDb();
