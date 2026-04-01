import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { householdDb } from "@packages/core-plants/db";
import type { Household } from "@packages/core-plants/household";

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
    })
];
