import { http, HttpResponse } from "msw";

import { getUserId, usersDb } from "@packages/core-module/db";
import { householdDb } from "@packages/core-plants/db";
import type { Household, HouseholdMember } from "@packages/core-plants/household";

export const managementHouseholdHandlers = [
    http.get("/api/management/household", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Return the household the user belongs to, if any
        const household = householdDb.getByMemberId(userId);

        return HttpResponse.json(household ? [household] : []);
    }),

    http.post("/api/management/household", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { name: string };
        const now = new Date();

        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const household: Household = {
            id,
            name: body.name,
            createdBy: userId,
            createdAt: now,
            members: [
                {
                    userId,
                    userName: userId === "user-alice" ? "Alice" : userId === "user-bob" ? "Bob" : "User",
                    email: `${userId}@example.com`,
                    role: "owner",
                    joinedAt: now,
                    status: "active"
                }
            ]
        };

        householdDb.create(household);

        return HttpResponse.json(household, { status: 201 });
    }),

    http.post("/api/management/household/:id/members", async ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const household = householdDb.getById(householdId);

        if (!household) {
            return new HttpResponse(null, { status: 404 });
        }

        const body = (await request.json()) as { email: string };
        const invitedUser = usersDb.getByEmail(body.email);

        if (!invitedUser) {
            return HttpResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user is already a member
        if (household.members.some(m => m.userId === invitedUser.id)) {
            return HttpResponse.json({ error: "User is already a member" }, { status: 409 });
        }

        const member: HouseholdMember = {
            userId: invitedUser.id,
            userName: invitedUser.name,
            email: invitedUser.email,
            role: "member",
            joinedAt: new Date(),
            status: "invited"
        };

        const updated = householdDb.addMember(householdId, member);

        return HttpResponse.json(updated, { status: 201 });
    }),

    http.put("/api/management/household/:id/members/:userId", async ({ request, params }) => {
        const currentUserId = getUserId(request);

        if (!currentUserId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const targetUserId = params.userId as string;

        const body = (await request.json()) as { status: string };
        const updated = householdDb.updateMemberStatus(householdId, targetUserId, body.status as "active" | "invited");

        if (!updated) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(updated);
    }),

    http.delete("/api/management/household/:id/members/:userId", ({ request, params }) => {
        const currentUserId = getUserId(request);

        if (!currentUserId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const targetUserId = params.userId as string;

        const updated = householdDb.removeMember(householdId, targetUserId);

        if (!updated) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(updated);
    })
];
