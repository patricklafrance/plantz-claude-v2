import type { Household } from "../household/householdTypes.ts";

class HouseholdDb {
    #store = new Map<string, Household>();

    getAll(): Household[] {
        return [...this.#store.values()].toSorted((a, b) => a.name.localeCompare(b.name));
    }

    getById(id: string): Household | undefined {
        return this.#store.get(id);
    }

    getByMemberId(userId: string): Household | undefined {
        for (const household of this.#store.values()) {
            if (household.members.some(m => m.userId === userId)) {
                return household;
            }
        }

        return undefined;
    }

    create(household: Household): Household {
        this.#store.set(household.id, household);

        return household;
    }

    update(id: string, data: Partial<Household>): Household | undefined {
        const existing = this.#store.get(id);

        if (!existing) {
            return undefined;
        }

        const updated: Household = { ...existing, ...data };
        this.#store.set(id, updated);

        return updated;
    }

    delete(id: string): boolean {
        return this.#store.delete(id);
    }

    reset(households?: Household[]): void {
        this.#store.clear();

        if (households) {
            for (const household of households) {
                this.#store.set(household.id, household);
            }
        }
    }
}

export const householdDb = new HouseholdDb();
