import type { ResponsibilityAssignment } from "../responsibilityTypes.ts";

const store = new Map<string, ResponsibilityAssignment>();

export const assignmentsDb = {
    getAll(): ResponsibilityAssignment[] {
        return [...store.values()];
    },

    getByPlantId(plantId: string): ResponsibilityAssignment | undefined {
        for (const assignment of store.values()) {
            if (assignment.plantId === plantId) {
                return assignment;
            }
        }

        return undefined;
    },

    create(assignment: ResponsibilityAssignment): ResponsibilityAssignment {
        store.set(assignment.id, assignment);

        return assignment;
    },

    update(id: string, partial: Partial<ResponsibilityAssignment>): ResponsibilityAssignment | undefined {
        const existing = store.get(id);

        if (!existing) {
            return undefined;
        }

        const updated = { ...existing, ...partial };
        store.set(id, updated);

        return updated;
    },

    delete(id: string): boolean {
        return store.delete(id);
    },

    reset(assignments: ResponsibilityAssignment[]): void {
        store.clear();

        for (const assignment of assignments) {
            store.set(assignment.id, assignment);
        }
    }
};
