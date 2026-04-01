export type Confidence = "low" | "medium" | "high";

export interface AdjustmentRecommendation {
    plantId: string;
    currentInterval: number;
    suggestedInterval: number;
    explanation: string;
    confidence: Confidence;
    recentBehaviorSummary: string;
}

export interface AdjustmentEvent {
    id: string;
    plantId: string;
    previousInterval: number;
    newInterval: number;
    adjustmentDate: Date;
    note?: string;
}
