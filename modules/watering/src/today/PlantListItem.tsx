import { Check, Droplets } from "lucide-react";
import { memo, useCallback } from "react";

import type { Plant } from "@packages/api/entities/plants";
import { Checkbox } from "@packages/components";

import { locations, wateringTypes } from "./constants.ts";
import { PLANT_LIST_GRID } from "./plantListLayout.ts";
import { getOptionLabel, isDueForWatering } from "./plantUtils.ts";

interface PlantListItemProps {
    plant: Plant;
    selected?: boolean | undefined;
    onClick: (plant: Plant) => void;
    onToggleSelect?: ((id: string) => void) | undefined;
}

export const PlantListItem = memo(function PlantListItem({ plant, selected = false, onClick, onToggleSelect }: PlantListItemProps) {
    const due = isDueForWatering(plant);

    const handleClick = useCallback(() => onClick(plant), [onClick, plant]);

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={`View ${plant.name}`}
            className={`border-border focus-visible:outline-ring flex h-full w-full cursor-pointer items-center gap-3 border-b px-5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${PLANT_LIST_GRID} ${due ? "bg-terracotta/5 border-l-terracotta border-l-2" : "hover:bg-secondary/40"}`}
        >
            {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- stopPropagation wrapper to isolate checkbox clicks from row button */}
            <div className="flex items-center justify-center" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                {onToggleSelect ? (
                    <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(plant.id)} aria-label={`Select ${plant.name}`} />
                ) : (
                    <span className="w-4" />
                )}
            </div>
            <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold">{plant.name}</span>
                {due && (
                    <>
                        <Droplets className="text-terracotta size-3.5 shrink-0" aria-hidden="true" />
                        <span className="sr-only">Due for watering</span>
                    </>
                )}
            </div>
            <span className="text-muted-foreground hidden truncate text-sm md:block">{plant.wateringQuantity}</span>
            <span className="text-muted-foreground hidden truncate text-sm md:block">{getOptionLabel(wateringTypes, plant.wateringType)}</span>
            <span className="text-muted-foreground hidden truncate text-sm md:block">{getOptionLabel(locations, plant.location)}</span>
            <span className="hidden md:flex md:items-center">
                {plant.mistLeaves && <Check className="text-muted-foreground size-3.5" aria-label="Mist leaves" />}
            </span>
        </button>
    );
});
