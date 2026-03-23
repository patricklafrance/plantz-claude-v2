import type { AdjustmentEvent } from "@packages/core-plants/care-event";
import { defaultSeedPlants } from "@packages/core-plants/db";

// Generate a few deterministic adjustment events for the first 3 plants that have care event history.
// Uses fixed absolute dates for Chromatic determinism.
const alicePlants = defaultSeedPlants.filter((p) => p.userId === "user-alice").slice(0, 3);

export const defaultSeedAdjustments: AdjustmentEvent[] = [
    {
        id: "adj-seed-1",
        plantId: alicePlants[0]?.id ?? "plant-unknown-1",
        previousInterval: 7,
        newInterval: 5,
        adjustmentDate: new Date(2024, 8, 15),
        note: "Adjusted to water more frequently based on watering patterns.",
    },
    {
        id: "adj-seed-2",
        plantId: alicePlants[1]?.id ?? "plant-unknown-2",
        previousInterval: 14,
        newInterval: 10,
        adjustmentDate: new Date(2024, 7, 20),
    },
    {
        id: "adj-seed-3",
        plantId: alicePlants[2]?.id ?? "plant-unknown-3",
        previousInterval: 7,
        newInterval: 10,
        adjustmentDate: new Date(2024, 7, 10),
        note: "Plant needs less water in fall.",
    },
];
