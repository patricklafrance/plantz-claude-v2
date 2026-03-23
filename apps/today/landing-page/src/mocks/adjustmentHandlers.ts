import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { getFrequencyDays } from "@packages/core-plants";
import type { WateringFrequencyId } from "@packages/core-plants";
import { computeAdjustmentRecommendation } from "@packages/core-plants/care-event";
import { careEventsDb, plantsDb } from "@packages/core-plants/db";

import { adjustmentsDb } from "./adjustmentsDb.ts";

const FREQUENCY_IDS: WateringFrequencyId[] = ["0.5-week", "1-week", "1.5-weeks", "2-weeks", "2.5-weeks"];

function findClosestFrequencyId(days: number): WateringFrequencyId {
    let closest: WateringFrequencyId = "1-week";
    let minDiff = Infinity;

    for (const id of FREQUENCY_IDS) {
        const freqDays = getFrequencyDays(id);
        const diff = Math.abs(freqDays - days);

        if (diff < minDiff) {
            minDiff = diff;
            closest = id;
        }
    }

    return closest;
}

export const todayAdjustmentHandlers = [
    http.get("/api/today/adjustments/recommendation", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const url = new URL(request.url);
        const plantId = url.searchParams.get("plantId");
        const currentIntervalStr = url.searchParams.get("currentInterval");

        if (!plantId || !currentIntervalStr) {
            return HttpResponse.json(null);
        }

        const currentInterval = Number(currentIntervalStr);
        const events = careEventsDb.getAllByPlant(plantId);
        const wateredCount = events.filter((e) => e.eventType === "watered").length;

        if (adjustmentsDb.isDismissed(plantId, wateredCount)) {
            return HttpResponse.json(null);
        }

        const recommendation = computeAdjustmentRecommendation(events, currentInterval);

        return HttpResponse.json(recommendation);
    }),

    http.post("/api/today/adjustments", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as {
            plantId: string;
            previousInterval: number;
            newInterval: number;
            note?: string;
        };

        const event = {
            id: crypto.randomUUID(),
            plantId: body.plantId,
            previousInterval: body.previousInterval,
            newInterval: body.newInterval,
            adjustmentDate: new Date(),
            note: body.note,
        };

        adjustmentsDb.insert(event);

        // Update the plant's watering frequency and next watering date
        const plant = plantsDb.get(body.plantId);

        if (plant) {
            const newFrequencyId = findClosestFrequencyId(body.newInterval);
            const newFrequencyDays = getFrequencyDays(newFrequencyId);
            const next = new Date();
            next.setDate(next.getDate() + Math.ceil(newFrequencyDays));
            plantsDb.update(body.plantId, {
                wateringFrequency: newFrequencyId,
                nextWateringDate: next,
            });
        }

        return HttpResponse.json(event, { status: 201 });
    }),

    http.post("/api/today/adjustments/dismiss", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { plantId: string };
        const events = careEventsDb.getAllByPlant(body.plantId);
        const wateredCount = events.filter((e) => e.eventType === "watered").length;
        adjustmentsDb.dismiss(body.plantId, wateredCount);

        return new HttpResponse(null, { status: 204 });
    }),

    http.get("/api/today/adjustments", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const url = new URL(request.url);
        const plantId = url.searchParams.get("plantId");

        if (!plantId) {
            return HttpResponse.json([]);
        }

        const events = adjustmentsDb.getAllByPlant(plantId);

        return HttpResponse.json(events);
    }),
];
