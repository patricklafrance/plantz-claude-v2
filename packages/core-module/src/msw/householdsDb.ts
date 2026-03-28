import type { Household } from "../householdSchema.ts";

class HouseholdsDb {
    #households: Household[] = [{ id: "household-green-house", name: "Green House", ownerId: "user-alice", createdAt: new Date(2025, 0, 1) }];

    getAll(): Household[] {
        return [...this.#households];
    }

    getById(id: string): Household | undefined {
        return this.#households.find(h => h.id === id);
    }

    getByOwner(ownerId: string): Household[] {
        return this.#households.filter(h => h.ownerId === ownerId);
    }
}

export const householdsDb = new HouseholdsDb();
