import type { CareEvent } from "../../entities/care-events/types.ts";

class CareEventDb {
    #store = new Map<string, CareEvent>();

    getAllByPlant(plantId: string): CareEvent[] {
        return [...this.#store.values()].filter(e => e.plantId === plantId).toSorted((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    insert(event: CareEvent): CareEvent {
        this.#store.set(event.id, event);

        return event;
    }

    reset(events: CareEvent[]): void {
        this.#store.clear();

        for (const event of events) {
            this.#store.set(event.id, event);
        }
    }
}

export const careEventDb = new CareEventDb();
