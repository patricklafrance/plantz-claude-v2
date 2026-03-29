import { delay, http, HttpResponse } from "msw";

import type { Plant } from "@packages/core-plants";

type PlantsData = Plant[] | "loading" | "error";

interface ShareHandlerOptions {
    shareDelay?: number | "infinite" | undefined;
    householdId?: string | null | undefined;
}

export function createManagementPlantHandlers(data: PlantsData, options?: ShareHandlerOptions) {
    const { shareDelay, householdId = null } = options ?? {};

    // Clone plant data to prevent cross-story mutation when share handlers mutate in-place
    const plants = typeof data === "string" ? data : data.map(p => ({ ...p }));

    return [
        http.get("/api/management/plants/membership", () => {
            return HttpResponse.json({ householdId });
        }),
        http.get("/api/management/plants", async () => {
            if (plants === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (plants === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(plants);
        }),
        http.get("/api/management/plants/:id", ({ params }) => {
            if (typeof plants === "string") {
                return new HttpResponse(null, { status: 404 });
            }

            const plant = plants.find(p => p.id === params.id);

            return plant ? HttpResponse.json(plant) : new HttpResponse(null, { status: 404 });
        }),
        http.post("/api/management/plants", () => HttpResponse.json({}, { status: 201 })),
        http.put("/api/management/plants/:id", () => HttpResponse.json({}, { status: 200 })),
        http.delete("/api/management/plants/:id", () => new HttpResponse(null, { status: 204 })),
        http.delete("/api/management/plants", () => new HttpResponse(null, { status: 204 })),
        http.patch("/api/management/plants/:id/share", async ({ params, request }) => {
            if (shareDelay) {
                await delay(shareDelay);
            }

            if (typeof plants === "string") {
                return new HttpResponse(null, { status: 404 });
            }

            const plant = plants.find(p => p.id === params.id);

            if (!plant) {
                return new HttpResponse(null, { status: 404 });
            }

            const body = (await request.json()) as { householdId: string | null };

            // Mutate the cloned plant so the subsequent GET refetch returns updated data
            if (body.householdId) {
                (plant as Record<string, unknown>).householdId = body.householdId;
            } else {
                delete (plant as Record<string, unknown>).householdId;
            }

            return HttpResponse.json(plant);
        })
    ];
}
