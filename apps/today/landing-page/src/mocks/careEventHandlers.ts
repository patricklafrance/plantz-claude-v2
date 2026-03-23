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

        const event = {
            id: crypto.randomUUID(),
            plantId: body.plantId,
            eventType: body.eventType,
            eventDate: new Date(),
            notes: body.notes,
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

        for (const plantId of body.plantIds) {
            const event = {
                id: crypto.randomUUID(),
                plantId,
                eventType: body.eventType,
                eventDate: new Date(),
                notes: body.notes,
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
    }),
];
