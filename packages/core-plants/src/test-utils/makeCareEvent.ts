import type { CareEvent } from "../care-event/careEventTypes.ts";

let counter = 0;

export function makeCareEvent(overrides: Partial<CareEvent> = {}): CareEvent {
    return {
        id: `event-${++counter}`,
        plantId: "plant-1",
        eventType: "watered",
        eventDate: new Date(2024, 6, 15),
        ...overrides,
    };
}
