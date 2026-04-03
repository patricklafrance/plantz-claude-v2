import { delay, http, HttpResponse } from "msw";

import type { CareEvent } from "../../entities/care-events/types.ts";
import type { Plant } from "../../entities/plants/types.ts";

type PlantsData = Plant[] | "loading" | "error";

interface CreateTodayPlantHandlersOptions {
    /** When set, the PUT handler returns a 409 conflict with this care event. */
    conflictEvent?: CareEvent | undefined;
    /** When true, the PUT handler delays infinitely (for loading states). */
    putLoading?: boolean | undefined;
}

export function createTodayPlantHandlers(data: PlantsData, options: CreateTodayPlantHandlersOptions = {}) {
    const { conflictEvent, putLoading } = options;

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
        http.put("/api/today/plants/:id", async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>;

            if (conflictEvent && body.force !== true) {
                return HttpResponse.json({ conflict: true, recentEvent: conflictEvent }, { status: 409 });
            }

            if (putLoading) {
                await delay("infinite");

                return HttpResponse.json({}, { status: 200 });
            }

            return HttpResponse.json({}, { status: 200 });
        }),
        http.delete("/api/today/plants/:id", () => new HttpResponse(null, { status: 204 })),
        http.delete("/api/today/plants", () => new HttpResponse(null, { status: 204 }))
    ];
}
