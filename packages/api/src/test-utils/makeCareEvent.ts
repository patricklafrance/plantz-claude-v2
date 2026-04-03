import type { CareEvent } from "../entities/care-events/types.ts";

export function makeCareEvent(overrides: Partial<CareEvent> & { id: string; plantId: string }): CareEvent {
    return {
        actorId: "user-alice",
        actorName: "Alice",
        eventType: "watered",
        timestamp: new Date(2025, 2, 15, 10, 0, 0),
        ...overrides
    };
}
