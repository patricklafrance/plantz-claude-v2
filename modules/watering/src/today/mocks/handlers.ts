import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { plantsDb, householdDb } from "@packages/core-plants/db";

const todayHouseholdHandler = http.get("/api/today/household", ({ request }) => {
    const userId = getUserId(request);

    if (!userId) {
        return new HttpResponse(null, { status: 401 });
    }

    const household = householdDb.getByMemberId(userId);

    return HttpResponse.json(household ?? null);
});

export const todayPlantHandlers = [
    todayHouseholdHandler,
    http.get("/api/today/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const userPlants = plantsDb.getAllByUser(userId);

        // Include shared plants from the user's household
        const household = householdDb.getByMemberId(userId);
        if (household) {
            const sharedPlants = plantsDb.getAllByHousehold(household.id);
            // Merge, avoiding duplicates (user's own shared plants are already in userPlants)
            const userPlantIds = new Set(userPlants.map(p => p.id));
            const additionalShared = sharedPlants.filter(p => !userPlantIds.has(p.id));
            const allPlants = [...userPlants, ...additionalShared];
            allPlants.sort((a, b) => a.name.localeCompare(b.name));

            return HttpResponse.json(allPlants);
        }

        return HttpResponse.json(userPlants);
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
