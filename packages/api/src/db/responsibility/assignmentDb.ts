import type { ResponsibilityAssignment } from "../../entities/responsibility/types.ts";
import { generateId } from "../generateId.ts";

class AssignmentDb {
    #store = new Map<string, ResponsibilityAssignment>();

    get(plantId: string): ResponsibilityAssignment | undefined {
        return [...this.#store.values()].find(a => a.plantId === plantId);
    }

    getByHousehold(householdId: string): ResponsibilityAssignment[] {
        return [...this.#store.values()].filter(a => a.householdId === householdId);
    }

    set(assignment: ResponsibilityAssignment): ResponsibilityAssignment {
        this.#store.set(assignment.id, assignment);

        return assignment;
    }

    upsertByPlant(plantId: string, data: Partial<ResponsibilityAssignment> & { householdId: string }): ResponsibilityAssignment {
        const existing = this.get(plantId);

        if (existing) {
            const updated = { ...existing, ...data };
            this.#store.set(existing.id, updated);

            return updated;
        }

        const id = generateId();
        const assignment: ResponsibilityAssignment = {
            id,
            plantId,
            householdId: data.householdId,
            strategy: data.strategy ?? "unassigned",
            assignedMemberId: data.assignedMemberId,
            assignedMemberName: data.assignedMemberName
        };

        this.#store.set(id, assignment);

        return assignment;
    }

    delete(plantId: string): boolean {
        const assignment = this.get(plantId);

        if (!assignment) {
            return false;
        }

        return this.#store.delete(assignment.id);
    }

    reset(assignments: ResponsibilityAssignment[]): void {
        this.#store.clear();

        for (const assignment of assignments) {
            this.#store.set(assignment.id, assignment);
        }
    }
}

export const assignmentDb = new AssignmentDb();
