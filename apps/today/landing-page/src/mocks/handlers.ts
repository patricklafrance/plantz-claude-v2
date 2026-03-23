import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { plantsDb } from "@packages/core-plants/db";

export const todayPlantHandlers = [
    http.get("/api/today/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const plants = plantsDb.getAllByUser(userId);

        return HttpResponse.json(plants);
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
    }),
];
