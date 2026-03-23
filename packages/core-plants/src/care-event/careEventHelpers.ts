import type { CareEvent } from "./careEventTypes.ts";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getWateredEventsByDateAsc(events: CareEvent[]): CareEvent[] {
    return events.filter((e) => e.eventType === "watered").toSorted((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
}
