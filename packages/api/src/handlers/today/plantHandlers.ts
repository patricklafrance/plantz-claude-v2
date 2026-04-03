import { http, HttpResponse } from "msw";

import { getUserId } from "../../db/auth/getUserId.ts";
import { careEventDb } from "../../db/care-events/careEventDb.ts";
import { householdDb } from "../../db/household/householdDb.ts";
import { plantsDb } from "../../db/plants/plantsDb.ts";

export const todayPlantHandlers = [
    http.get("/api/today/plants", () => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const plants = plantsDb.getAllByUser(userId);

        return HttpResponse.json(plants);
    }),

    http.put("/api/today/plants/:id", async ({ params, request }) => {
        const { id } = params;
        const body = (await request.json()) as Record<string, unknown>;
        const plant = plantsDb.update(id as string, body);

        if (!plant) {
            return new HttpResponse(null, { status: 404 });
        }

        // Record a care event when watering (nextWateringDate update indicates watering)
        if (body.nextWateringDate) {
            const userId = getUserId();

            if (userId) {
                let actorName = userId;
                const household = householdDb.getHouseholdByUser(userId);

                if (household) {
                    const member = householdDb.getMemberByUserId(household.id, userId);

                    if (member) {
                        actorName = member.userName;
                    }
                }

                const eventId =
                    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

                careEventDb.insert({
                    id: eventId,
                    plantId: id as string,
                    actorId: userId,
                    actorName,
                    eventType: "watered",
                    timestamp: new Date()
                });
            }
        }

        return HttpResponse.json(plant);
    }),

    http.delete("/api/today/plants/:id", ({ params }) => {
        const { id } = params;
        const deleted = plantsDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.delete("/api/today/plants", async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        plantsDb.deleteMany(body.ids);

        return new HttpResponse(null, { status: 204 });
    })
];
