import type { Household, HouseholdMember } from "../../entities/household/types.ts";

class HouseholdDb {
    #households = new Map<string, Household>();
    #members = new Map<string, HouseholdMember>();

    getAllHouseholds(): Household[] {
        return [...this.#households.values()];
    }

    getHousehold(id: string): Household | undefined {
        return this.#households.get(id);
    }

    getHouseholdByUser(userId: string): Household | undefined {
        const member = [...this.#members.values()].find(m => m.userId === userId);

        if (!member) {
            return undefined;
        }

        return this.#households.get(member.householdId);
    }

    insertHousehold(household: Household): Household {
        this.#households.set(household.id, household);

        return household;
    }

    getMembers(householdId: string): HouseholdMember[] {
        return [...this.#members.values()].filter(m => m.householdId === householdId).toSorted((a, b) => a.userName.localeCompare(b.userName));
    }

    getMember(id: string): HouseholdMember | undefined {
        return this.#members.get(id);
    }

    getMemberByUserId(householdId: string, userId: string): HouseholdMember | undefined {
        return [...this.#members.values()].find(m => m.householdId === householdId && m.userId === userId);
    }

    insertMember(member: HouseholdMember): HouseholdMember {
        this.#members.set(member.id, member);

        return member;
    }

    reset(households: Household[], members: HouseholdMember[]): void {
        this.#households.clear();
        this.#members.clear();

        for (const household of households) {
            this.#households.set(household.id, household);
        }

        for (const member of members) {
            this.#members.set(member.id, member);
        }
    }
}

export const householdDb = new HouseholdDb();
