import { http, HttpResponse } from "msw";

interface WateredTodayEntry {
    plantId: string;
    actorId: string;
}

export function createWateredTodayHandlers(entries: WateredTodayEntry[]) {
    return [
        http.get("/api/today/watered-today", () => {
            return HttpResponse.json(entries);
        })
    ];
}
