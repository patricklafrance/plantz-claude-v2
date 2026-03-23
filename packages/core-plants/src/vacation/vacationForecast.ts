import type { WateringFrequencyId } from "../constants.ts";
import type { Plant } from "../plantSchema.ts";
import type { PlantRecommendation, PlanningStrategy, RecommendationType, RiskLevel } from "./vacationTypes.ts";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseWateringInterval(frequency: WateringFrequencyId): number {
    const map: Record<WateringFrequencyId, number> = {
        "0.5-week": 3.5,
        "1-week": 7,
        "1.5-weeks": 10.5,
        "2-weeks": 14,
        "2.5-weeks": 17.5,
    };

    return map[frequency] ?? 7;
}

function projectNextWaterings(plant: Plant, through: Date): Date[] {
    const interval = parseWateringInterval(plant.wateringFrequency as WateringFrequencyId);
    const intervalMs = interval * MS_PER_DAY;
    const dates: Date[] = [];
    let current = new Date(plant.nextWateringDate.getTime());

    while (current <= through) {
        dates.push(new Date(current.getTime()));
        current = new Date(current.getTime() + intervalMs);
    }

    return dates;
}

function classifyPlant(plant: Plant, startDate: Date, endDate: Date, strategy: PlanningStrategy, today: Date = new Date()): RecommendationType {
    const nextWatering = plant.nextWateringDate;
    const interval = parseWateringInterval(plant.wateringFrequency as WateringFrequencyId);
    const intervalMs = interval * MS_PER_DAY;

    // Already overdue — next watering is before today
    if (nextWatering < today) {
        return "already-overdue";
    }

    // Next watering falls between today and start date — user can handle it before leaving
    if (nextWatering >= today && nextWatering < startDate) {
        return "water-before-trip";
    }

    // Next watering falls during the trip
    if (nextWatering >= startDate && nextWatering <= endDate) {
        // Conservative: if the interval allows watering a few days early before departure, shift to water-before-trip
        if (strategy === "conservative") {
            const daysUntilNextWatering = (nextWatering.getTime() - today.getTime()) / MS_PER_DAY;
            // If the plant can be watered early (within half the interval before trip), water before trip
            if (daysUntilNextWatering <= interval) {
                return "water-before-trip";
            }
        }

        // Minimal-intervention: shift borderline cases toward safe-until-return if close to end
        if (strategy === "minimal-intervention") {
            const daysAfterStart = (nextWatering.getTime() - startDate.getTime()) / MS_PER_DAY;
            const tripDuration = (endDate.getTime() - startDate.getTime()) / MS_PER_DAY;
            // If the watering is in the last quarter of the trip, consider it safe until return
            if (daysAfterStart > tripDuration * 0.75) {
                return "safe-until-return";
            }
        }

        return "delegate-watering";
    }

    // Next watering is after the trip
    if (nextWatering > endDate) {
        // Conservative: check if the _next_ watering after nextWateringDate falls during the trip
        if (strategy === "conservative") {
            const secondWatering = new Date(nextWatering.getTime() + intervalMs);
            if (secondWatering >= startDate && secondWatering <= endDate) {
                return "water-before-trip";
            }
        }

        return "safe-until-return";
    }

    return "safe-until-return";
}

function assessRisk(plant: Plant, returnDate: Date, today: Date = new Date()): RiskLevel {
    const interval = parseWateringInterval(plant.wateringFrequency as WateringFrequencyId);
    const nextWatering = plant.nextWateringDate;

    // Already overdue
    if (nextWatering < today) {
        const daysOverdue = (today.getTime() - nextWatering.getTime()) / MS_PER_DAY;
        if (daysOverdue > interval) {
            return "high";
        }

        return "medium";
    }

    // How many watering cycles are missed during the trip
    const daysBetweenWateringAndReturn = (returnDate.getTime() - nextWatering.getTime()) / MS_PER_DAY;
    const missedCycles = daysBetweenWateringAndReturn / interval;

    if (missedCycles >= 2) {
        return "high";
    }

    if (missedCycles >= 1) {
        return "medium";
    }

    return "low";
}

export function generateForecast(plants: Plant[], startDate: Date, endDate: Date, strategy: PlanningStrategy, today: Date = new Date()): PlantRecommendation[] {
    return plants.map((plant) => {
        const type = classifyPlant(plant, startDate, endDate, strategy, today);
        const riskLevel = assessRisk(plant, endDate, today);

        let suggestedActionDate: Date;
        let reasoning: string;

        switch (type) {
            case "already-overdue":
                suggestedActionDate = today;
                reasoning = `This plant was due for watering on ${formatSimpleDate(plant.nextWateringDate)} and is overdue. Water it as soon as possible.`;
                break;
            case "water-before-trip":
                suggestedActionDate = plant.nextWateringDate < startDate ? plant.nextWateringDate : new Date(startDate.getTime() - MS_PER_DAY);
                reasoning = `Water this plant before you leave. Next watering is due ${formatSimpleDate(plant.nextWateringDate)}.`;
                break;
            case "delegate-watering": {
                const wateringsDuringTrip = projectNextWaterings(plant, endDate).filter((d) => d >= startDate && d <= endDate);
                suggestedActionDate = wateringsDuringTrip[0] ?? plant.nextWateringDate;
                const count = wateringsDuringTrip.length;
                reasoning = `This plant needs ${count} watering${count !== 1 ? "s" : ""} during your trip. Ask someone to help.`;
                break;
            }
            case "safe-until-return":
                suggestedActionDate = plant.nextWateringDate;
                reasoning = `This plant won't need watering until ${formatSimpleDate(plant.nextWateringDate)}, after your return.`;
                break;
        }

        return {
            plantId: plant.id,
            plantName: plant.name,
            type,
            reasoning,
            suggestedActionDate,
            riskLevel,
        };
    });
}

function formatSimpleDate(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
