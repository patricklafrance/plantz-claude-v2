import type { ResponsibilityAssignment } from "../assignment/assignmentSchema.ts";

const store = new Map<string, ResponsibilityAssignment>();

export const assignmentsDb = {
    getAll(): ResponsibilityAssignment[] {
        return [...store.values()];
    },

    getAllByPlant(plantId: string): ResponsibilityAssignment[] {
        return [...store.values()].filter(a => a.plantId === plantId);
    },

    getAllByHousehold(householdId: string): ResponsibilityAssignment[] {
        return [...store.values()].filter(a => a.householdId === householdId);
    },

    insert(assignment: ResponsibilityAssignment): ResponsibilityAssignment {
        store.set(assignment.id, assignment);

        return assignment;
    },

    reset(assignments: ResponsibilityAssignment[]): void {
        store.clear();

        for (const assignment of assignments) {
            store.set(assignment.id, assignment);
        }
    }
};
