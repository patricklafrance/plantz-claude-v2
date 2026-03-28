import { http, HttpResponse } from "msw";

import type { Household } from "@packages/core-module";
import { getUserId, householdsDb } from "@packages/core-module/db";

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
    })
];
