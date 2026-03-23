import type { CareEvent } from "../care-event/careEventTypes.ts";

const store = new Map<string, CareEvent>();

export const careEventsDb = {
    getAllByPlant(plantId: string): CareEvent[] {
        return [...store.values()].filter((e) => e.plantId === plantId).toSorted((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
    },

    getAll(): CareEvent[] {
        return [...store.values()];
    },

    insert(event: CareEvent): CareEvent {
        store.set(event.id, event);

        return event;
    },

    reset(events: CareEvent[]): void {
        store.clear();

        for (const event of events) {
            store.set(event.id, event);
        }
    },
};
