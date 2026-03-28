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

    insert(household: Household): Household {
        this.#households.push(household);
        return household;
    }

    update(id: string, changes: Partial<Omit<Household, "id" | "ownerId" | "createdAt">>): Household | undefined {
        const index = this.#households.findIndex(h => h.id === id);
        if (index === -1) {
            return undefined;
        }
        const updated = { ...this.#households[index]!, ...changes };
        this.#households[index] = updated;
        return updated;
    }

    delete(id: string): boolean {
        const index = this.#households.findIndex(h => h.id === id);
        if (index === -1) {
            return false;
        }
        this.#households.splice(index, 1);
        return true;
    }
}

export const householdsDb = new HouseholdsDb();
