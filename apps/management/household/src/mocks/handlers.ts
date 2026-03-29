import { http, HttpResponse } from "msw";

import type { Household } from "@packages/core-household";
import { householdsDb, membersDb } from "@packages/core-household/db";
import { getUserId, usersDb } from "@packages/core-module/db";

export const managementHouseholdHandlers = [
    http.get("/api/management/household", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Find the household the user belongs to via membership
        const membership = membersDb.getByUserId(userId);

        if (!membership) {
            return HttpResponse.json([]);
        }

        const household = householdsDb.get(membership.householdId);

        return HttpResponse.json(household ? [household] : []);
    }),

    http.get("/api/management/household/:id/members", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const members = membersDb.getAllByHousehold(id as string);

        // Enrich members with user names (BFF pattern)
        const enriched = members.map(member => {
            const user = usersDb.getById(member.userId);

            return {
                ...member,
                userName: user?.name ?? "Unknown"
            };
        });

        return HttpResponse.json(enriched);
    }),

    http.post("/api/management/household", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const now = new Date();

        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const household = householdsDb.insert({
            ...(body as Record<string, unknown>),
            id,
            createdBy: userId,
            creationDate: now
        } as Household);

        // Auto-add the creator as a member
        const memberId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        membersDb.insert({
            id: memberId,
            householdId: id,
            userId,
            joinedDate: now
        });

        return HttpResponse.json(household, { status: 201 });
    })
];
