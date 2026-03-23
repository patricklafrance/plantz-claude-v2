import type { AdjustmentEvent, AdjustmentRecommendation } from "../care-event/adjustmentTypes.ts";

let counter = 0;

export function makeAdjustmentRecommendation(overrides: Partial<AdjustmentRecommendation> = {}): AdjustmentRecommendation {
    return {
        plantId: "plant-1",
        currentInterval: 7,
        suggestedInterval: 5,
        explanation: "Based on 12 watering events, your plant is being watered more frequently than the current schedule. The average interval is 4.8 days versus the configured 7 days.",
        confidence: "high",
        recentBehaviorSummary: "Recent waterings average 4.6 days apart across the last 5 events.",
        ...overrides,
    };
}

export function makeAdjustmentEvent(overrides: Partial<AdjustmentEvent> = {}): AdjustmentEvent {
    return {
        id: `adj-${++counter}`,
        plantId: "plant-1",
        previousInterval: 7,
        newInterval: 5,
        adjustmentDate: new Date(2024, 6, 15),
        ...overrides,
    };
}
