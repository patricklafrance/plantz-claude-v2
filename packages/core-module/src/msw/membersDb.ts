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

    add(member: HouseholdMember): HouseholdMember {
        this.#members.push(member);

        return member;
    }

    remove(memberId: string): boolean {
        const idx = this.#members.findIndex(m => m.id === memberId);

        if (idx === -1) {
            return false;
        }

        this.#members.splice(idx, 1);

        return true;
    }
}

export const membersDb = new MembersDb();
