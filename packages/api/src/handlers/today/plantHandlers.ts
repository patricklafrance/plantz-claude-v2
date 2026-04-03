import { http, HttpResponse } from "msw";

import { getUserId } from "../../db/auth/getUserId.ts";
import { careEventDb } from "../../db/care-events/careEventDb.ts";
import { generateId } from "../../db/generateId.ts";
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
        const plantId = id as string;
        const plant = plantsDb.get(plantId);

        if (!plant) {
            return new HttpResponse(null, { status: 404 });
        }

        if (body.nextWateringDate && plant.shared && body.force !== true) {
            const userId = getUserId();

            if (userId) {
                const events = careEventDb.getAllByPlant(plantId);
                const today = new Date().toDateString();
                const recentEvent = events.find(e => e.eventType === "watered" && e.timestamp.toDateString() === today && e.actorId !== userId);

                if (recentEvent) {
                    return HttpResponse.json({ conflict: true, recentEvent }, { status: 409 });
                }
            }
        }

        const updated = plantsDb.update(plantId, body);

        if (!updated) {
            return new HttpResponse(null, { status: 404 });
        }

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

                careEventDb.insert({
                    id: generateId(),
                    plantId,
                    actorId: userId,
                    actorName,
                    eventType: "watered",
                    timestamp: new Date()
                });
            }
        }

        return HttpResponse.json(updated);
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
