import { createOptimisticAction } from "@tanstack/db";
import type { QueryClient } from "@tanstack/react-query";

import { householdSchema, type Household } from "@packages/core-household";
import { createHouseholdCollection, type HouseholdCollection } from "@packages/core-household/collection";
import { getCurrentUserId, getAuthHeaders } from "@packages/core-module";

const API_BASE = "/api/management/household";
const INVITATIONS_API_BASE = "/api/management/household/invitations";

async function fetchHouseholds(): Promise<Household[]> {
    const response = await fetch(API_BASE, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch households: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map(item => householdSchema.parse(item));
}

export function createManagementHouseholdCollection(queryClient: QueryClient): HouseholdCollection {
    return createHouseholdCollection({
        queryKey: ["management", "household", "list"],
        queryFn: fetchHouseholds,
        queryClient
    });
}

export function createManagementHouseholdActions(householdCollection: HouseholdCollection) {
    const insertHousehold = createOptimisticAction<{ name: string }>({
        onMutate: data => {
            householdCollection.insert({
                ...data,
                id: crypto.randomUUID(),
                createdBy: getCurrentUserId() ?? "",
                creationDate: new Date()
            } as Household);
        },
        mutationFn: async data => {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to create household: ${response.status}`);
            }

            await householdCollection.utils.refetch();
        }
    });

    return { insertHousehold };
}

export async function sendInvitation(householdId: string, inviteeEmail: string): Promise<{ error?: string }> {
    const response = await fetch(INVITATIONS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ householdId, inviteeEmail })
    });

    if (response.status === 422) {
        const data = (await response.json()) as { error: string };

        return { error: data.error };
    }

    if (!response.ok) {
        throw new Error(`Failed to send invitation: ${response.status}`);
    }

    return {};
}

export async function acceptInvitation(invitationId: string): Promise<void> {
    const response = await fetch(`${INVITATIONS_API_BASE}/${invitationId}/accept`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to accept invitation: ${response.status}`);
    }
}

export async function declineInvitation(invitationId: string): Promise<void> {
    const response = await fetch(`${INVITATIONS_API_BASE}/${invitationId}/decline`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to decline invitation: ${response.status}`);
    }
}
