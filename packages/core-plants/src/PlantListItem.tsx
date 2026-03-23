import { Check, Droplets, Pencil, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

import { Button, Checkbox } from "@packages/components";

import { locations, wateringTypes } from "./constants.ts";
import { PLANT_LIST_GRID } from "./plantListLayout.ts";
import type { Plant } from "./plantSchema.ts";
import { getOptionLabel, isDueForWatering } from "./plantUtils.ts";

interface PlantListItemProps {
    plant: Plant;
    selected?: boolean | undefined;
    onClick?: ((plant: Plant) => void) | undefined;
    onToggleSelect?: ((id: string) => void) | undefined;
    onEdit?: ((plant: Plant) => void) | undefined;
    onDelete?: ((plant: Plant) => void) | undefined;
    onMarkWatered?: ((plant: Plant) => void) | undefined;
}

export const PlantListItem = memo(function PlantListItem({ plant, selected = false, onClick, onToggleSelect, onEdit, onDelete, onMarkWatered }: PlantListItemProps) {
    const due = isDueForWatering(plant);

    const isClickable = !!(onClick || onEdit);

    const handleToggleSelect = useCallback(() => onToggleSelect?.(plant.id), [onToggleSelect, plant.id]);
    const handleClick = useCallback(() => (onClick ?? onEdit)?.(plant), [onClick, onEdit, plant]);
    const handleEdit = useCallback(() => onEdit?.(plant), [onEdit, plant]);
    const handleDelete = useCallback(() => onDelete?.(plant), [onDelete, plant]);
    const handleMarkWatered = useCallback(() => onMarkWatered?.(plant), [onMarkWatered, plant]);

    return (
        <div className={`border-border relative flex h-full items-center gap-3 border-b px-4 py-2.5 transition-colors ${due ? "bg-destructive/5" : "hover:bg-muted/50"}`}>
            {isClickable && <button type="button" onClick={handleClick} aria-label={`View ${plant.name}`} className="focus-visible:outline-ring absolute inset-0 z-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px]" />}
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
                </div>
                <span className="text-muted-foreground w-full truncate text-xs whitespace-nowrap md:hidden">
                    {plant.wateringQuantity} · {getOptionLabel(wateringTypes, plant.wateringType)} · {getOptionLabel(locations, plant.location)}
                    {plant.mistLeaves ? " · Mist" : ""}
                </span>
                <span className="text-muted-foreground hidden truncate text-xs md:block">{plant.wateringQuantity}</span>
                <span className="text-muted-foreground hidden truncate text-xs md:block">{getOptionLabel(wateringTypes, plant.wateringType)}</span>
                <span className="text-muted-foreground hidden truncate text-xs md:block">{getOptionLabel(locations, plant.location)}</span>
                <span className="hidden md:block">{plant.mistLeaves && <Check className="text-muted-foreground size-3.5" aria-label="Mist leaves" />}</span>
            </div>
            {(onEdit || onDelete || (onMarkWatered && due)) && (
                <div className="relative z-10 flex shrink-0 items-center gap-1">
                    {onMarkWatered && due && (
                        <Button variant="ghost" size="icon-xs" onClick={handleMarkWatered} aria-label={`Mark ${plant.name} as watered`}>
                            <Droplets />
                        </Button>
                    )}
                    {onEdit && (
                        <Button variant="ghost" size="icon-xs" onClick={handleEdit} aria-label={`Edit ${plant.name}`}>
                            <Pencil />
                        </Button>
                    )}
                    {onDelete && (
                        <Button variant="ghost" size="icon-xs" onClick={handleDelete} aria-label={`Delete ${plant.name}`}>
                            <Trash2 />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});
