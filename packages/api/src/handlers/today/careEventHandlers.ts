import { http, HttpResponse } from "msw";

import { getUserId } from "../../db/auth/getUserId.ts";
import { careEventDb } from "../../db/care-events/careEventDb.ts";

export const todayCareEventHandlers = [
    http.get("/api/today/care-events", ({ request }) => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const url = new URL(request.url);
        const plantId = url.searchParams.get("plantId");

        if (!plantId) {
            return HttpResponse.json(careEventDb.getAll());
        }

        const events = careEventDb.getAllByPlant(plantId);

        return HttpResponse.json(events);
    })
];
