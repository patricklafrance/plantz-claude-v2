import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Switch, Input, Button, Label } from "@packages/components";

import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import type { PlantFilters } from "./usePlantFilters.ts";

interface FilterBarProps {
    filters: PlantFilters;
    onFilterChange: <K extends keyof PlantFilters>(key: K, value: PlantFilters[K]) => void;
    onClear: () => void;
    hasActiveFilters: boolean;
    showDueForWatering?: boolean;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string | null; onChange: (value: string | null) => void; options: readonly { id: string; label: string }[] }) {
    return (
        <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs whitespace-nowrap">{label}</Label>
            <Select value={value ?? ""} onValueChange={(val) => onChange(!val || val === "" ? null : val)}>
                <SelectTrigger size="sm" className="w-32" aria-label={label}>
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="">All</SelectItem>
                        {options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

export function FilterBar({ filters, onFilterChange, onClear, hasActiveFilters, showDueForWatering = true }: FilterBarProps) {
    return (
        <div className="border-border bg-muted/30 flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-name" className="text-muted-foreground text-xs whitespace-nowrap">
                    Name
                </Label>
                <Input id="filter-name" className="h-7 w-36 text-xs" placeholder="Filter by name..." value={filters.name} onChange={(e) => onFilterChange("name", e.target.value)} />
            </div>
            <FilterSelect label="Location" value={filters.location} onChange={(v) => onFilterChange("location", v)} options={locations} />
            <FilterSelect label="Luminosity" value={filters.luminosity} onChange={(v) => onFilterChange("luminosity", v)} options={luminosities} />
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-mist" className="text-muted-foreground text-xs whitespace-nowrap">
                    Mist leaves
                </Label>
                <Switch id="filter-mist" size="sm" checked={filters.mistLeaves === true} onCheckedChange={(checked) => onFilterChange("mistLeaves", checked ? true : null)} />
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-soil" className="text-muted-foreground text-xs whitespace-nowrap">
                    Soil type
                </Label>
                <Input id="filter-soil" className="h-7 w-28 text-xs" placeholder="Filter..." value={filters.soilType} onChange={(e) => onFilterChange("soilType", e.target.value)} />
            </div>
            <FilterSelect label="Frequency" value={filters.wateringFrequency} onChange={(v) => onFilterChange("wateringFrequency", v)} options={wateringFrequencies} />
            <FilterSelect label="Type" value={filters.wateringType} onChange={(v) => onFilterChange("wateringType", v)} options={wateringTypes} />
            {showDueForWatering && (
                <div className="flex items-center gap-2">
                    <Label htmlFor="filter-due" className="text-muted-foreground text-xs whitespace-nowrap">
                        Due for watering
                    </Label>
                    <Switch id="filter-due" size="sm" checked={filters.dueForWatering} onCheckedChange={(checked) => onFilterChange("dueForWatering", checked)} />
                </div>
            )}
            {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={onClear}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}
