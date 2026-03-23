import type { AdjustmentRecommendation, Confidence } from "./adjustmentTypes.ts";
import { MS_PER_DAY, getWateredEventsByDateAsc } from "./careEventHelpers.ts";
import type { CareEvent } from "./careEventTypes.ts";

const MIN_INTERVAL = 2;
const MAX_INTERVAL = 21;
const DEVIATION_THRESHOLD = 0.2;
const DEFAULT_MIN_EVENTS = 5;

function computeIntervals(watered: CareEvent[]): number[] {
    const intervals: number[] = [];

    for (let i = 1; i < watered.length; i++) {
        const diff = (watered[i]!.eventDate.getTime() - watered[i - 1]!.eventDate.getTime()) / MS_PER_DAY;
        intervals.push(diff);
    }

    return intervals;
}

function computeVariance(intervals: number[], mean: number): number {
    if (intervals.length === 0) return 0;

    let sumSqDiff = 0;

    for (const interval of intervals) {
        const diff = interval - mean;
        sumSqDiff += diff * diff;
    }

    return sumSqDiff / intervals.length;
}

export function computeConfidence(eventCount: number, variance: number): Confidence {
    if (eventCount < 5 || variance > 16) {
        return "low";
    }

    if (eventCount >= 10 && variance <= 4) {
        return "high";
    }

    return "medium";
}

export function formatIntervalLabel(days: number): string {
    const rounded = Math.round(days);

    if (rounded === 1) {
        return "every day";
    }

    return `every ${rounded} days`;
}

export function computeAdjustmentRecommendation(events: CareEvent[], currentIntervalDays: number, options?: { minEvents?: number }): AdjustmentRecommendation | null {
    const minEvents = options?.minEvents ?? DEFAULT_MIN_EVENTS;
    const watered = getWateredEventsByDateAsc(events);

    if (watered.length < minEvents) {
        return null;
    }

    const intervals = computeIntervals(watered);

    if (intervals.length === 0) {
        return null;
    }

    const sum = intervals.reduce((acc, val) => acc + val, 0);
    const averageInterval = sum / intervals.length;
    const deviation = Math.abs(averageInterval - currentIntervalDays) / currentIntervalDays;

    if (deviation < DEVIATION_THRESHOLD) {
        return null;
    }

    const suggestedInterval = Math.round(averageInterval);
    const clampedInterval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, suggestedInterval));

    // After clamping, re-check if the suggestion differs meaningfully from the current interval
    const clampedDeviation = Math.abs(clampedInterval - currentIntervalDays) / currentIntervalDays;

    if (clampedDeviation < DEVIATION_THRESHOLD) {
        return null;
    }

    const variance = computeVariance(intervals, averageInterval);
    const confidence = computeConfidence(watered.length, variance);

    const direction = clampedInterval < currentIntervalDays ? "more frequently" : "less frequently";
    const explanation = `Based on ${watered.length} watering events, your plant is being watered ${direction} than the current schedule. The average interval is ${averageInterval.toFixed(1)} days versus the configured ${currentIntervalDays} days.`;

    const recentEvents = watered.slice(-5);
    const recentIntervals = computeIntervals(recentEvents);
    const recentAvg = recentIntervals.length > 0 ? recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length : averageInterval;
    const recentBehaviorSummary = `Recent waterings average ${recentAvg.toFixed(1)} days apart across the last ${recentEvents.length} events.`;

    return {
        plantId: watered[0]!.plantId,
        currentInterval: currentIntervalDays,
        suggestedInterval: clampedInterval,
        explanation,
        confidence,
        recentBehaviorSummary,
    };
}
