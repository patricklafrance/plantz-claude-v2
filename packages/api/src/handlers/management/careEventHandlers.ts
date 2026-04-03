import { http, HttpResponse } from "msw";

import { getUserId } from "../../db/auth/getUserId.ts";
import { careEventDb } from "../../db/care-events/careEventDb.ts";

export const managementCareEventHandlers = [
    http.get("/api/management/plants/:id/care-events", ({ params }) => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const events = careEventDb.getAllByPlant(id as string);

        return HttpResponse.json(events);
    })
];
