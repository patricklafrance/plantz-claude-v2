import { useState, useCallback } from "react";

export interface PlantFilters {
    name: string;
    location: string | null;
    luminosity: string | null;
    mistLeaves: boolean | null;
    soilType: string;
    wateringFrequency: string | null;
    wateringType: string | null;
    dueForWatering: boolean;
    household: string | null;
    assignedTo: string | null;
}

const defaultFilters: PlantFilters = {
    name: "",
    location: null,
    luminosity: null,
    mistLeaves: null,
    soilType: "",
    wateringFrequency: null,
    wateringType: null,
    dueForWatering: false,
    household: null,
    assignedTo: null
};

export function usePlantFilters() {
    const [filters, setFilters] = useState<PlantFilters>(defaultFilters);

    const updateFilter = useCallback(<K extends keyof PlantFilters>(key: K, value: PlantFilters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    const hasActiveFilters =
        filters.name !== "" ||
        filters.location !== null ||
        filters.luminosity !== null ||
        filters.mistLeaves !== null ||
        filters.soilType !== "" ||
        filters.wateringFrequency !== null ||
        filters.wateringType !== null ||
        filters.dueForWatering ||
        filters.household !== null ||
        filters.assignedTo !== null;

    return { filters, updateFilter, clearFilters, hasActiveFilters };
}
