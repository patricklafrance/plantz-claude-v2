import { delay, http, HttpResponse } from "msw";

import type { CareEvent } from "@packages/core-plants/care-event";

type CareEventsData = CareEvent[] | "loading" | "error";

export function createCareEventHandlers(data: CareEventsData) {
    return [
        http.get("/api/today/care-events", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        }),
        http.post("/api/today/care-events", async ({ request }) => {
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
        }),
        http.post("/api/today/care-events/bulk", async ({ request }) => {
            const body = (await request.json()) as { plantIds: string[]; eventType: string; notes?: string; actorId?: string };
            const actorName = body.actorId === "user-alice" ? "Alice" : body.actorId === "user-bob" ? "Bob" : undefined;

            const events = body.plantIds.map((plantId, index) => ({
                id: `bulk-event-${index + 1}`,
                plantId,
                eventType: body.eventType,
                eventDate: new Date().toISOString(),
                notes: body.notes,
                actorId: body.actorId,
                actorName
            }));

            return HttpResponse.json(events, { status: 201 });
        })
    ];
}
