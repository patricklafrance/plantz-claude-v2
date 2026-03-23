import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { plantsDb } from "@packages/core-plants/db";

import { vacationDb } from "./vacationDb.ts";

export const todayVacationPlannerHandlers = [
    http.get("/api/today/vacation-planner/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const plants = plantsDb.getAllByUser(userId);

        return HttpResponse.json(plants);
    }),

    http.post("/api/today/vacation-planner/plans", async ({ request }) => {
        const body = await request.json();
        const plan = vacationDb.create(body as Parameters<typeof vacationDb.create>[0]);

        return HttpResponse.json(plan, { status: 201 });
    }),

    http.get("/api/today/vacation-planner/plans/active", () => {
        const activePlan = vacationDb.getActive();

        if (!activePlan) {
            return HttpResponse.json(null);
        }

        return HttpResponse.json(activePlan);
    }),

    http.put("/api/today/vacation-planner/plans/:id", async ({ params, request }) => {
        const { id } = params;
        const body = await request.json();
        const updated = vacationDb.update(id as string, body as Partial<Parameters<typeof vacationDb.create>[0]>);

        if (!updated) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(updated);
    }),

    http.delete("/api/today/vacation-planner/plans/:id", ({ params }) => {
        const { id } = params;
        const deleted = vacationDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),
];
