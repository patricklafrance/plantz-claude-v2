import type { CareEvent, CareEventType } from "@packages/core-plants/care-event";
import { defaultSeedPlants } from "@packages/core-plants/db";

const eventTypes: CareEventType[] = ["watered", "skipped", "delegated"];

// Use fixed absolute dates for Chromatic determinism. Each plant gets events
// spaced roughly 5-10 days apart across mid-2024 to early 2025.
function generateEventsForPlant(plantId: string, plantIndex: number): CareEvent[] {
    const events: CareEvent[] = [];
    // Vary event count per plant: 5-15 events, determined by plant index
    const eventCount = 5 + (plantIndex % 11);
    // Start date base: June 2024, offset by plant index so each plant has unique dates
    const baseTime = new Date(2024, 5, 1 + (plantIndex % 15)).getTime();

    for (let i = 0; i < eventCount; i++) {
        // Space events 5-10 days apart, determined by both indices
        const daysOffset = i * (5 + ((plantIndex + i) % 6));
        const eventDate = new Date(baseTime + daysOffset * 24 * 60 * 60 * 1000);
        eventDate.setHours(0, 0, 0, 0);

        // Mostly "watered", occasional "skipped" or "delegated"
        const typeIndex = (plantIndex + i) % 7 === 0 ? 1 : (plantIndex + i) % 11 === 0 ? 2 : 0;
        const eventType = eventTypes[typeIndex]!;

        events.push({
            id: `care-${plantId}-${i}`,
            plantId,
            eventType,
            eventDate,
            notes: i % 4 === 0 ? "Soil was very dry" : undefined,
        });
    }

    return events;
}

// Generate care events for the first 20 "user-alice" plants
const alicePlants = defaultSeedPlants.filter((p) => p.userId === "user-alice").slice(0, 20);

export const defaultSeedCareEvents: CareEvent[] = alicePlants.flatMap((plant, index) => generateEventsForPlant(plant.id, index));
