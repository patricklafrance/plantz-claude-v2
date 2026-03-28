import { delay, http, HttpResponse } from "msw";

import type { Household } from "@packages/core-module";

type HouseholdsData = Household[] | "loading" | "error";

interface MemberSeed {
    id: string;
    householdId: string;
    userId: string;
    name: string;
    email: string;
    joinedAt: Date;
}

interface AssignmentSeed {
    id: string;
    householdId: string;
    plantId: string;
    plantName: string;
    assignmentType: "fixed" | "rotating" | "unassigned";
    assignedUserId?: string;
}

export function createManagementHouseholdHandlers(data: HouseholdsData, memberSeeds: MemberSeed[] = [], assignmentSeeds: AssignmentSeed[] = []) {
    // Keep a mutable copy so POST/PUT/DELETE mutations are visible to the
    // subsequent GET refetch that `collection.utils.refetch()` triggers.
    const store: Household[] = typeof data === "string" ? [] : [...data];

    // Mutable members store for Storybook — mirrors the membersDb pattern
    const membersStore: MemberSeed[] = [...memberSeeds];

    // Mutable assignments store for Storybook — mirrors the assignmentsDb pattern
    const assignmentsStore: AssignmentSeed[] = [...assignmentSeeds];

    return [
        http.get("/api/management/households", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(store);
        }),
        http.get("/api/management/households/:id", ({ params }) => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 404 });
            }

            const household = store.find(h => h.id === params["id"]);

            return household ? HttpResponse.json(household) : new HttpResponse(null, { status: 404 });
        }),
        http.post("/api/management/households", async ({ request }) => {
            const body = (await request.json()) as { name: string };
            const created: Household = {
                id: crypto.randomUUID(),
                name: body.name,
                ownerId: "user-alice",
                createdAt: new Date()
            };

            store.push(created);

            return HttpResponse.json(created, { status: 201 });
        }),
        http.put("/api/management/households/:id", async ({ params, request }) => {
            const body = (await request.json()) as { name: string };
            const idx = store.findIndex(h => h.id === params["id"]);

            if (idx !== -1) {
                store[idx] = { ...store[idx], name: body.name } as Household;
            }

            return HttpResponse.json(idx !== -1 ? store[idx] : {}, { status: 200 });
        }),
        http.delete("/api/management/households/:id", ({ params }) => {
            const idx = store.findIndex(h => h.id === params["id"]);

            if (idx !== -1) {
                store.splice(idx, 1);
            }

            return new HttpResponse(null, { status: 204 });
        }),

        http.get("/api/management/households/:id/members", ({ params }) => {
            const householdId = params["id"] as string;
            const members = membersStore.filter(m => m.householdId === householdId);

            // Return enriched shape (name + email included, matching the live handler)
            return HttpResponse.json(
                members.map(m => ({
                    id: m.id,
                    householdId: m.householdId,
                    userId: m.userId,
                    joinedAt: m.joinedAt,
                    name: m.name,
                    email: m.email
                }))
            );
        }),

        http.post("/api/management/households/:id/members", async ({ params, request }) => {
            const householdId = params["id"] as string;
            const body = (await request.json()) as { email: string };

            // Simulate email lookup against a fixed set for Storybook
            const knownUsers: Record<string, { id: string; name: string; email: string }> = {
                "alice@example.com": { id: "user-alice", name: "Alice", email: "alice@example.com" },
                "bob@example.com": { id: "user-bob", name: "Bob", email: "bob@example.com" },
                "charlie@example.com": { id: "user-charlie", name: "Charlie", email: "charlie@example.com" }
            };

            const user = knownUsers[body.email];

            if (!user) {
                return HttpResponse.json({ error: "User not found" }, { status: 422 });
            }

            const newMember: MemberSeed = {
                id: crypto.randomUUID(),
                householdId,
                userId: user.id,
                name: user.name,
                email: user.email,
                joinedAt: new Date()
            };

            membersStore.push(newMember);

            const wire = {
                id: newMember.id,
                householdId: newMember.householdId,
                userId: newMember.userId,
                joinedAt: newMember.joinedAt,
                name: newMember.name,
                email: newMember.email
            };

            return HttpResponse.json(wire, { status: 201 });
        }),

        http.delete("/api/management/households/:id/members/:memberId", ({ params }) => {
            const memberId = params["memberId"] as string;
            const idx = membersStore.findIndex(m => m.id === memberId);

            if (idx !== -1) {
                membersStore.splice(idx, 1);
            }

            return new HttpResponse(null, { status: 204 });
        }),

        http.get("/api/management/households/:id/assignments", ({ params }) => {
            const householdId = params["id"] as string;
            const assignments = assignmentsStore.filter(a => a.householdId === householdId);

            return HttpResponse.json(assignments);
        }),

        http.put("/api/management/households/:id/assignments/:plantId", async ({ params, request }) => {
            const householdId = params["id"] as string;
            const plantId = params["plantId"] as string;
            const body = (await request.json()) as { assignmentType: "fixed" | "rotating" | "unassigned"; assignedUserId?: string };

            const id = `${householdId}-${plantId}`;
            const existingIdx = assignmentsStore.findIndex(a => a.id === id);

            const existing = existingIdx !== -1 ? assignmentsStore[existingIdx] : assignmentsStore.find(a => a.plantId === plantId);
            const plantName = existing?.plantName ?? plantId;

            const updated: AssignmentSeed = {
                id,
                householdId,
                plantId,
                plantName,
                assignmentType: body.assignmentType,
                assignedUserId: body.assignmentType === "fixed" ? body.assignedUserId : undefined
            };

            if (existingIdx !== -1) {
                assignmentsStore[existingIdx] = updated;
            } else {
                assignmentsStore.push(updated);
            }

            return HttpResponse.json(updated);
        })
    ];
}
