export type CareEventType = "watered" | "skipped" | "delegated";

export interface CareEvent {
    id: string;
    plantId: string;
    eventType: CareEventType;
    eventDate: Date;
    notes?: string;
}

export interface CareInsight {
    lastWateredDate: Date;
    averageWateringIntervalDays: number;
    wateringStreak: number;
    missedWateringCount: number;
    consistencyScore: number;
}
