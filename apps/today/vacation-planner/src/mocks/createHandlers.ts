import { delay, http, HttpResponse } from "msw";

import type { Plant } from "@packages/core-plants";
import type { VacationPlan } from "@packages/core-plants/vacation";

type PlantsData = Plant[] | "loading" | "error";

export function createTodayVacationPlannerHandlers(data: PlantsData, activePlan?: VacationPlan | null) {
    return [
        http.get("/api/today/vacation-planner/plants", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        }),
        http.post("/api/today/vacation-planner/plans", async ({ request }) => {
            const body = await request.json();

            return HttpResponse.json(body, { status: 201 });
        }),
        http.get("/api/today/vacation-planner/plans/active", () => {
            return HttpResponse.json(activePlan ?? null);
        }),
        http.put("/api/today/vacation-planner/plans/:id", async ({ request }) => {
            const body = await request.json();

            return HttpResponse.json(body);
        }),
        http.delete("/api/today/vacation-planner/plans/:id", () => new HttpResponse(null, { status: 204 })),
    ];
}
