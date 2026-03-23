import { MS_PER_DAY, getWateredEventsByDateAsc } from "./careEventHelpers.ts";
import type { CareEvent, CareInsight } from "./careEventTypes.ts";

function sortByDateDesc(events: CareEvent[]): CareEvent[] {
    return events.toSorted((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
}

export function getLastWateredDate(events: CareEvent[]): Date | null {
    const watered = events.filter((e) => e.eventType === "watered");
    if (watered.length === 0) return null;

    const sorted = sortByDateDesc(watered);

    return sorted[0]!.eventDate;
}

export function computeAverageInterval(events: CareEvent[]): number | null {
    const watered = getWateredEventsByDateAsc(events);

    return computeAverageIntervalFromWatered(watered);
}

function computeAverageIntervalFromWatered(watered: CareEvent[]): number | null {
    if (watered.length < 2) return null;

    let totalDays = 0;

    for (let i = 1; i < watered.length; i++) {
        const diff = watered[i]!.eventDate.getTime() - watered[i - 1]!.eventDate.getTime();
        totalDays += diff / MS_PER_DAY;
    }

    return Math.round((totalDays / (watered.length - 1)) * 10) / 10;
}

export function computeWateringStreak(events: CareEvent[]): number {
    const sorted = sortByDateDesc(events);
    let streak = 0;

    for (const event of sorted) {
        if (event.eventType === "watered") {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

export function countMissedWaterings(events: CareEvent[], expectedFrequencyDays: number): number {
    const watered = getWateredEventsByDateAsc(events);

    return countMissedFromWatered(watered, expectedFrequencyDays);
}

function countMissedFromWatered(watered: CareEvent[], expectedFrequencyDays: number): number {
    if (watered.length < 2 || expectedFrequencyDays <= 0) return 0;

    let missed = 0;
    const threshold = expectedFrequencyDays * 1.5;

    for (let i = 1; i < watered.length; i++) {
        const diff = (watered[i]!.eventDate.getTime() - watered[i - 1]!.eventDate.getTime()) / MS_PER_DAY;

        if (diff > threshold) {
            missed += Math.floor(diff / expectedFrequencyDays) - 1;
        }
    }

    return missed;
}

export function computeCareInsights(events: CareEvent[], expectedFrequencyDays = 7): CareInsight | null {
    if (events.length === 0) return null;

    // Pre-compute watered events once to avoid redundant filtering across helpers
    const wateredAsc = getWateredEventsByDateAsc(events);

    if (wateredAsc.length === 0) return null;

    const lastWateredDate = wateredAsc[wateredAsc.length - 1]!.eventDate;
    const averageInterval = computeAverageIntervalFromWatered(wateredAsc);
    const streak = computeWateringStreak(events);
    const missed = countMissedFromWatered(wateredAsc, expectedFrequencyDays);

    const expectedCount = wateredAsc.length + missed;
    const consistencyScore = expectedCount > 0 ? Math.round((wateredAsc.length / expectedCount) * 100) : 100;

    return {
        lastWateredDate,
        averageWateringIntervalDays: averageInterval ?? 0,
        wateringStreak: streak,
        missedWateringCount: missed,
        consistencyScore,
    };
}
