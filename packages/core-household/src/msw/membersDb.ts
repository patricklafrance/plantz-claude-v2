import type { HouseholdMember } from "../householdMemberSchema.ts";

class MembersDb {
    #store = new Map<string, HouseholdMember>();

    getAll(): HouseholdMember[] {
        return [...this.#store.values()];
    }

    getAllByHousehold(householdId: string): HouseholdMember[] {
        return [...this.#store.values()].filter(m => m.householdId === householdId);
    }

    getByUserId(userId: string): HouseholdMember | undefined {
        return [...this.#store.values()].find(m => m.userId === userId);
    }

    get(id: string): HouseholdMember | undefined {
        return this.#store.get(id);
    }

    insert(member: HouseholdMember): HouseholdMember {
        this.#store.set(member.id, member);

        return member;
    }

    delete(id: string): boolean {
        return this.#store.delete(id);
    }

    deleteByHousehold(householdId: string): void {
        for (const [id, member] of this.#store) {
            if (member.householdId === householdId) {
                this.#store.delete(id);
            }
        }
    }

    reset(members: HouseholdMember[]): void {
        this.#store.clear();

        for (const member of members) {
            this.#store.set(member.id, member);
        }
    }
}

export const membersDb = new MembersDb();
