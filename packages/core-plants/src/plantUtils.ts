import type { Plant } from "./plantSchema.ts";
import type { PlantFilters } from "./usePlantFilters.ts";

const FREQUENCY_DAYS: Record<string, number> = {
    "0.5-week": 3.5,
    "1-week": 7,
    "1.5-weeks": 10.5,
    "2-weeks": 14,
    "2.5-weeks": 17.5,
};

export function getFrequencyDays(frequency: string): number {
    return FREQUENCY_DAYS[frequency] ?? 7;
}

export function getOptionLabel(options: readonly { id: string; label: string }[], id: string): string {
    return options.find((o) => o.id === id)?.label ?? id;
}

export function isDueForWatering(plant: Plant, now?: Date): boolean {
    const today = now ? new Date(now) : new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(plant.nextWateringDate);
    next.setHours(0, 0, 0, 0);
    return next <= today;
}

export function applyPlantFilters(plants: Plant[], filters: PlantFilters): Plant[] {
    let result = plants;

    if (filters.name) {
        const needle = filters.name.toLowerCase();
        result = result.filter((p) => p.name.toLowerCase().includes(needle));
    }
    if (filters.location) {
        result = result.filter((p) => p.location === filters.location);
    }
    if (filters.luminosity) {
        result = result.filter((p) => p.luminosity === filters.luminosity);
    }
    if (filters.mistLeaves !== null) {
        result = result.filter((p) => p.mistLeaves === filters.mistLeaves);
    }
    if (filters.wateringFrequency) {
        result = result.filter((p) => p.wateringFrequency === filters.wateringFrequency);
    }
    if (filters.wateringType) {
        result = result.filter((p) => p.wateringType === filters.wateringType);
    }
    if (filters.dueForWatering) {
        result = result.filter((p) => isDueForWatering(p));
    }
    if (filters.soilType) {
        const needle = filters.soilType.toLowerCase();
        result = result.filter((p) => p.soilType?.toLowerCase().includes(needle));
    }

    return result;
}
