import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { getFrequencyDays } from "@packages/core-plants";
import type { CareEventType } from "@packages/core-plants/care-event";
import { careEventsDb, plantsDb } from "@packages/core-plants/db";

export const todayCareEventHandlers = [
    http.get("/api/today/care-events", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const url = new URL(request.url);
        const plantId = url.searchParams.get("plantId");

        if (!plantId) {
            return HttpResponse.json([]);
        }

        const events = careEventsDb.getAllByPlant(plantId);

        return HttpResponse.json(events);
    }),

    http.post("/api/today/care-events", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { plantId: string; eventType: CareEventType; notes?: string };

        // Duplicate-watering guard: return 409 if plant was already watered today
        if (body.eventType === "watered") {
            const today = new Date();
            const existingEvents = careEventsDb.getAllByPlant(body.plantId);
            const alreadyWateredToday = existingEvents.some(e => {
                if (e.eventType !== "watered") {
                    return false;
                }
                const eventDay = new Date(e.eventDate);
                return (
                    eventDay.getFullYear() === today.getFullYear() &&
                    eventDay.getMonth() === today.getMonth() &&
                    eventDay.getDate() === today.getDate()
                );
            });

            if (alreadyWateredToday) {
                return new HttpResponse(JSON.stringify({ error: "Plant already watered today" }), {
                    status: 409,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }

        const event = {
            id: crypto.randomUUID(),
            plantId: body.plantId,
            eventType: body.eventType,
            eventDate: new Date(),
            notes: body.notes,
            actorId: userId
        };

        careEventsDb.insert(event);

        // When watered, advance the plant's nextWateringDate
        if (body.eventType === "watered") {
            const plant = plantsDb.get(body.plantId);
            if (plant) {
                const days = getFrequencyDays(plant.wateringFrequency);
                const next = new Date();
                next.setDate(next.getDate() + Math.ceil(days));
                plantsDb.update(body.plantId, { nextWateringDate: next });
            }
        }

        return HttpResponse.json(event, { status: 201 });
    }),

    http.post("/api/today/care-events/bulk", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { plantIds: string[]; eventType: CareEventType; notes?: string };
        const events = [];

        const today = new Date();

        for (const plantId of body.plantIds) {
            // Skip plants already watered today
            if (body.eventType === "watered") {
                const existingEvents = careEventsDb.getAllByPlant(plantId);
                const alreadyWateredToday = existingEvents.some(e => {
                    if (e.eventType !== "watered") {
                        return false;
                    }
                    const eventDay = new Date(e.eventDate);
                    return (
                        eventDay.getFullYear() === today.getFullYear() &&
                        eventDay.getMonth() === today.getMonth() &&
                        eventDay.getDate() === today.getDate()
                    );
                });

                if (alreadyWateredToday) {
                    continue;
                }
            }

            const event = {
                id: crypto.randomUUID(),
                plantId,
                eventType: body.eventType,
                eventDate: new Date(),
                notes: body.notes,
                actorId: userId
            };

            careEventsDb.insert(event);
            events.push(event);

            if (body.eventType === "watered") {
                const plant = plantsDb.get(plantId);
                if (plant) {
                    const days = getFrequencyDays(plant.wateringFrequency);
                    const next = new Date();
                    next.setDate(next.getDate() + Math.ceil(days));
                    plantsDb.update(plantId, { nextWateringDate: next });
                }
            }
        }

        return HttpResponse.json(events, { status: 201 });
    })
];
