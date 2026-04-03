import { delay, http, HttpResponse } from "msw";

import type { CareEvent } from "../../entities/care-events/types.ts";

type CareEventData = CareEvent[] | "loading" | "error";

export function createManagementCareEventHandlers(data: CareEventData) {
    return [
        http.get("/api/management/plants/:id/care-events", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        })
    ];
}
