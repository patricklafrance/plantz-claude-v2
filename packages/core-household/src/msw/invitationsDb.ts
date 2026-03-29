import type { HouseholdInvitation } from "../householdInvitationSchema.ts";

class InvitationsDb {
    #store = new Map<string, HouseholdInvitation>();

    getAll(): HouseholdInvitation[] {
        return [...this.#store.values()];
    }

    getAllByHousehold(householdId: string): HouseholdInvitation[] {
        return [...this.#store.values()].filter(i => i.householdId === householdId);
    }

    get(id: string): HouseholdInvitation | undefined {
        return this.#store.get(id);
    }

    insert(invitation: HouseholdInvitation): HouseholdInvitation {
        this.#store.set(invitation.id, invitation);

        return invitation;
    }

    update(id: string, data: Partial<HouseholdInvitation>): HouseholdInvitation | undefined {
        const existing = this.#store.get(id);

        if (!existing) {
            return undefined;
        }

        const updated: HouseholdInvitation = { ...existing, ...data };
        this.#store.set(id, updated);

        return updated;
    }

    delete(id: string): boolean {
        return this.#store.delete(id);
    }

    reset(invitations: HouseholdInvitation[]): void {
        this.#store.clear();

        for (const invitation of invitations) {
            this.#store.set(invitation.id, invitation);
        }
    }
}

export const invitationsDb = new InvitationsDb();
