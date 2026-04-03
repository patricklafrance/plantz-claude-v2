import { Check, Droplets, Users } from "lucide-react";
import { memo, useCallback } from "react";

import type { Plant } from "@packages/api/entities/plants";
import { Badge, Checkbox } from "@packages/components";

import { locations, wateringTypes } from "./constants.ts";
import { PLANT_LIST_GRID } from "./plantListLayout.ts";
import { getOptionLabel, isDueForWatering } from "./plantUtils.ts";

interface PlantListItemProps {
    plant: Plant;
    selected?: boolean | undefined;
    assignedTo?: string | undefined;
    isMine?: boolean | undefined;
    onClick: (plant: Plant) => void;
    onToggleSelect?: ((id: string) => void) | undefined;
}

export const PlantListItem = memo(function PlantListItem({
    plant,
    selected = false,
    assignedTo,
    isMine = false,
    onClick,
    onToggleSelect
}: PlantListItemProps) {
    const due = isDueForWatering(plant);

    const handleToggleSelect = useCallback(() => onToggleSelect?.(plant.id), [onToggleSelect, plant.id]);
    const handleClick = useCallback(() => onClick(plant), [onClick, plant]);

    return (
        <div
            className={`border-border relative flex h-full items-center gap-3 border-b px-4 py-2.5 transition-colors ${due ? "bg-destructive/5" : "hover:bg-muted/50"} ${isMine ? "border-l-primary border-l-2" : ""}`}
        >
            <button
                type="button"
                onClick={handleClick}
                aria-label={`View ${plant.name}`}
                className="focus-visible:outline-ring absolute inset-0 z-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
            />
            {onToggleSelect && (
                <span className="relative z-10">
                    <Checkbox checked={selected} onCheckedChange={handleToggleSelect} aria-label={`Select ${plant.name}`} />
                </span>
            )}
            <div className={`flex min-w-0 flex-1 flex-col gap-0.5 ${PLANT_LIST_GRID} md:items-center md:gap-4`}>
                <div className="flex w-full items-center gap-2">
                    <span className="truncate text-sm font-medium">{plant.name}</span>
                    {due && (
                        <>
                            <Droplets className="text-destructive size-3.5 shrink-0" aria-hidden="true" />
                            <span className="sr-only">Due for watering</span>
                        </>
                    )}
                    {plant.shared && assignedTo && (
                        <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
                            <Users className="size-3" aria-hidden="true" />
                            {assignedTo}
                        </Badge>
                    )}
                    {plant.shared && !assignedTo && (
                        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                            <Users className="size-3" aria-hidden="true" />
                            Unassigned
                        </Badge>
                    )}
                </div>
                <span className="text-muted-foreground w-full truncate text-xs whitespace-nowrap md:hidden">
                    {plant.wateringQuantity} · {getOptionLabel(wateringTypes, plant.wateringType)} · {getOptionLabel(locations, plant.location)}
                    {plant.mistLeaves ? " · Mist" : ""}
                </span>
                <span className="text-muted-foreground hidden truncate text-xs md:block">{plant.wateringQuantity}</span>
                <span className="text-muted-foreground hidden truncate text-xs md:block">{getOptionLabel(wateringTypes, plant.wateringType)}</span>
                <span className="text-muted-foreground hidden truncate text-xs md:block">{getOptionLabel(locations, plant.location)}</span>
                <span className="hidden md:block">
                    {plant.mistLeaves && <Check className="text-muted-foreground size-3.5" aria-label="Mist leaves" />}
                </span>
            </div>
        </div>
    );
});
