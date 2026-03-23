import type { VacationPlan } from "@packages/core-plants/vacation";

const plans = new Map<string, VacationPlan>();

export const vacationDb = {
    create(plan: VacationPlan): VacationPlan {
        plans.set(plan.id, plan);

        return plan;
    },

    getActive(): VacationPlan | null {
        for (const plan of plans.values()) {
            if (plan.status === "active") {
                return plan;
            }
        }

        return null;
    },

    get(id: string): VacationPlan | null {
        return plans.get(id) ?? null;
    },

    update(id: string, changes: Partial<VacationPlan>): VacationPlan | null {
        const existing = plans.get(id);
        if (!existing) return null;

        const updated = { ...existing, ...changes, updatedAt: new Date() };
        plans.set(id, updated);

        return updated;
    },

    delete(id: string): boolean {
        return plans.delete(id);
    },
};
