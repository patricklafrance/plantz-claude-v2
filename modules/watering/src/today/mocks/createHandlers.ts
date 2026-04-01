import { delay, http, HttpResponse } from "msw";

import type { Plant } from "@packages/core-plants";
import type { Household } from "@packages/core-plants/household";

import type { VacationPlan } from "../../vacation-planner/vacationTypes.ts";

type PlantsData = Plant[] | "loading" | "error";

export function createTodayHouseholdHandler(household: Household | null = null) {
    return http.get("/api/today/household", () => HttpResponse.json(household));
}

export function createTodayPlantHandlers(data: PlantsData, activePlan?: VacationPlan | null) {
    return [
        createTodayHouseholdHandler(),
        http.get("/api/today/plants", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        }),
        http.delete("/api/today/plants/:id", () => new HttpResponse(null, { status: 204 })),
        http.delete("/api/today/plants", () => new HttpResponse(null, { status: 204 })),
        http.get("/api/today/vacation-planner/plans/active", () => HttpResponse.json(activePlan ?? null))
    ];
}
