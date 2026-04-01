import { delay, http, HttpResponse } from "msw";

import type { CareEvent } from "@packages/core-plants/care-event";

type CareEventsData = CareEvent[] | "loading" | "error";

interface ConflictOptions {
    actorName: string;
    eventDate: Date;
}

interface CreateCareEventHandlersOptions {
    postMode?: "success" | "loading" | "conflict";
    conflict?: ConflictOptions;
}

export function createCareEventHandlers(data: CareEventsData, options?: CreateCareEventHandlersOptions) {
    const { postMode = "success", conflict } = options ?? {};

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
            const body = (await request.json()) as { plantId: string; eventType: string; notes?: string };
            const forceDuplicate = request.headers.get("X-Force-Duplicate") === "true";

            if (postMode === "loading") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            if (postMode === "conflict" && !forceDuplicate && conflict) {
                return HttpResponse.json(
                    {
                        message: `${conflict.actorName} already watered this plant recently`,
                        lastEvent: {
                            id: "conflict-event-1",
                            plantId: body.plantId,
                            eventType: "watered",
                            eventDate: conflict.eventDate.toISOString(),
                            actorId: "user-other",
                            actorName: conflict.actorName
                        }
                    },
                    { status: 409 }
                );
            }

            return HttpResponse.json(
                {
                    id: "new-event-1",
                    plantId: body.plantId,
                    eventType: body.eventType,
                    eventDate: new Date(2024, 6, 20).toISOString(),
                    notes: body.notes,
                    actorId: "user-alice",
                    actorName: "Alice"
                },
                { status: 201 }
            );
        })
    ];
}
