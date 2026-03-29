import { delay, http, HttpResponse } from "msw";

import type { CareEvent } from "@packages/core-plants/care-event";

type CareEventsData = CareEvent[] | "loading" | "error";

export function createManagementCareEventHandlers(data: CareEventsData) {
    return [
        http.get("/api/management/care-events", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        }),
        http.post("/api/management/care-events", async ({ request }) => {
            const body = (await request.json()) as { plantId: string; eventType: string; notes?: string; actorId?: string };

            return HttpResponse.json(
                {
                    id: "new-event-1",
                    plantId: body.plantId,
                    eventType: body.eventType,
                    eventDate: new Date(2024, 6, 20).toISOString(),
                    notes: body.notes,
                    actorId: body.actorId,
                    actorName: body.actorId === "user-alice" ? "Alice" : body.actorId === "user-bob" ? "Bob" : undefined
                },
                { status: 201 }
            );
        })
    ];
}
