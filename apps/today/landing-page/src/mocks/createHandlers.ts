import { delay, http, HttpResponse } from "msw";

import type { Plant } from "@packages/core-plants";
import type { VacationPlan } from "@packages/core-plants/vacation";

import type { HouseholdContext } from "../useHouseholdContext.ts";

type PlantsData = Plant[] | "loading" | "error";

export interface HouseholdContextData {
    householdId: string;
    currentUserId: string;
    responsibilities: HouseholdContext["responsibilities"];
    lastCareEvents: HouseholdContext["lastCareEvents"];
    memberNames: HouseholdContext["memberNames"];
}

export function createTodayPlantHandlers(data: PlantsData, activePlan?: VacationPlan | null, householdContext?: HouseholdContextData | null) {
    return [
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
        http.get("/api/today/vacation-planner/plans/active", () => HttpResponse.json(activePlan ?? null)),
        http.get("/api/today/household-context", () => {
            if (!householdContext) {
                return HttpResponse.json({ isMember: false });
            }

            return HttpResponse.json({
                isMember: true,
                ...householdContext
            });
        })
    ];
}
