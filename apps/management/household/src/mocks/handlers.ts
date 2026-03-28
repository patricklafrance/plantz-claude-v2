import { http, HttpResponse } from "msw";

import type { Household, HouseholdMember } from "@packages/core-module";
import { getUserId, householdsDb, membersDb, usersDb } from "@packages/core-module/db";
import { assignmentsDb, plantsDb } from "@packages/core-plants/db";

export const managementHouseholdHandlers = [
    http.get("/api/management/households", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const households = householdsDb.getByOwner(userId);

        return HttpResponse.json(households);
    }),

    http.get("/api/management/households/:id", ({ params }) => {
        const { id } = params;
        const household = householdsDb.getById(id as string);

        if (!household) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(household);
    }),

    http.post("/api/management/households", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;

        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const household = householdsDb.insert({
            id,
            name: body["name"] as string,
            ownerId: userId,
            createdAt: new Date()
        } as Household);

        return HttpResponse.json(household, { status: 201 });
    }),

    http.put("/api/management/households/:id", async ({ params, request }) => {
        const { id } = params;
        const body = (await request.json()) as Record<string, unknown>;

        const household = householdsDb.update(id as string, { name: body["name"] as string });

        if (!household) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(household);
    }),

    http.delete("/api/management/households/:id", ({ params }) => {
        const { id } = params;
        const deleted = householdsDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.get("/api/management/households/:id/members", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const members = membersDb.getByHousehold(id as string);

        // Enrich each member with the user's display name and email so the
        // client does not need to make additional lookups.
        const enriched = members.map(m => {
            const user = usersDb.getById(m.userId);

            return {
                ...m,
                name: user?.name ?? m.userId,
                email: user?.email ?? ""
            };
        });

        return HttpResponse.json(enriched);
    }),

    http.post("/api/management/households/:id/members", async ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const body = (await request.json()) as { email: string };
        const invitedUser = usersDb.getByEmail(body.email);

        if (!invitedUser) {
            return HttpResponse.json({ error: "User not found" }, { status: 422 });
        }

        const memberId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const member = membersDb.add({
            id: memberId,
            householdId: id as string,
            userId: invitedUser.id,
            joinedAt: new Date()
        } as HouseholdMember);

        return HttpResponse.json(member, { status: 201 });
    }),

    http.delete("/api/management/households/:id/members/:memberId", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { memberId } = params;
        const removed = membersDb.remove(memberId as string);

        if (!removed) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.get("/api/management/households/:id/assignments", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const assignments = assignmentsDb.getAllByHousehold(id as string);

        const enriched = assignments.map(a => ({
            ...a,
            plantName: plantsDb.get(a.plantId)?.name ?? a.plantId
        }));

        return HttpResponse.json(enriched);
    }),

    http.put("/api/management/households/:id/assignments/:plantId", async ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id: householdId, plantId } = params;
        const body = (await request.json()) as { assignmentType: "fixed" | "rotating" | "unassigned"; assignedUserId?: string };

        const assignment = assignmentsDb.insert({
            id: `${householdId as string}-${plantId as string}`,
            householdId: householdId as string,
            plantId: plantId as string,
            assignmentType: body.assignmentType,
            assignedUserId: body.assignmentType === "fixed" ? body.assignedUserId : undefined
        });

        return HttpResponse.json(assignment);
    })
];
