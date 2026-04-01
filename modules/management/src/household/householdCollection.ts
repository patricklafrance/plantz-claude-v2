import { createOptimisticAction } from "@tanstack/db";
import type { QueryClient } from "@tanstack/react-query";

import { getCurrentUserId, getAuthHeaders } from "@packages/core-module";
import { createHouseholdCollection, type HouseholdCollection } from "@packages/core-plants/collection";
import { householdSchema, type Household } from "@packages/core-plants/household";

const API_BASE = "/api/management/household";

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
                id: crypto.randomUUID(),
                name: data.name,
                createdBy: getCurrentUserId() ?? "",
                createdAt: new Date(),
                members: [
                    {
                        userId: getCurrentUserId() ?? "",
                        userName: "You",
                        email: "",
                        role: "owner",
                        joinedAt: new Date(),
                        status: "active"
                    }
                ]
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

export function createManagementHouseholdMemberActions(householdCollection: HouseholdCollection) {
    const inviteMember = createOptimisticAction<{ householdId: string; email: string }>({
        onMutate: data => {
            householdCollection.update(data.householdId, draft => {
                draft.members = [
                    ...draft.members,
                    {
                        userId: `temp-${Date.now()}`,
                        userName: data.email.split("@")[0],
                        email: data.email,
                        role: "member",
                        joinedAt: new Date(),
                        status: "invited"
                    }
                ];
            });
        },
        mutationFn: async data => {
            const response = await fetch(`${API_BASE}/${data.householdId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ email: data.email })
            });

            if (!response.ok) {
                throw new Error(`Failed to invite member: ${response.status}`);
            }

            await householdCollection.utils.refetch();
        }
    });

    const acceptInvite = createOptimisticAction<{ householdId: string; userId: string }>({
        onMutate: data => {
            householdCollection.update(data.householdId, draft => {
                draft.members = draft.members.map(m => (m.userId === data.userId ? { ...m, status: "active" as const } : m));
            });
        },
        mutationFn: async data => {
            const response = await fetch(`${API_BASE}/${data.householdId}/members/${data.userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ status: "active" })
            });

            if (!response.ok) {
                throw new Error(`Failed to accept invite: ${response.status}`);
            }

            await householdCollection.utils.refetch();
        }
    });

    const declineInvite = createOptimisticAction<{ householdId: string; userId: string }>({
        onMutate: data => {
            householdCollection.update(data.householdId, draft => {
                draft.members = draft.members.filter(m => m.userId !== data.userId);
            });
        },
        mutationFn: async data => {
            const response = await fetch(`${API_BASE}/${data.householdId}/members/${data.userId}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to decline invite: ${response.status}`);
            }

            await householdCollection.utils.refetch();
        }
    });

    const removeMember = createOptimisticAction<{ householdId: string; userId: string }>({
        onMutate: data => {
            householdCollection.update(data.householdId, draft => {
                draft.members = draft.members.filter(m => m.userId !== data.userId);
            });
        },
        mutationFn: async data => {
            const response = await fetch(`${API_BASE}/${data.householdId}/members/${data.userId}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to remove member: ${response.status}`);
            }

            await householdCollection.utils.refetch();
        }
    });

    return { inviteMember, acceptInvite, declineInvite, removeMember };
}
