import { format } from "date-fns";
import { Droplets } from "lucide-react";
import type { ReactNode } from "react";

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from "@packages/components";
import { getOptionLabel, locations, luminosities, wateringFrequencies, wateringTypes } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

interface PlantDetailDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careSection?: ReactNode;
    onMarkWatered?: () => void;
    /** Name of the member who already watered this plant today, if any */
    wateredTodayByName?: string;
    /** Whether a watering action is in progress */
    isWatering?: boolean;
    /** Household name if the plant is shared */
    householdName?: string;
    /** Name of the member responsible for this plant, if assigned */
    assignedMemberName?: string;
}

export function PlantDetailDialog({
    plant,
    open,
    onOpenChange,
    careSection,
    onMarkWatered,
    wateredTodayByName,
    isWatering = false,
    householdName,
    assignedMemberName
}: PlantDetailDialogProps) {
    if (!plant) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{plant.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {plant.description && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Description</span>
                            <span className="text-sm">{plant.description}</span>
                        </div>
                    )}
                    {plant.family && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Family</span>
                            <span className="text-sm">{plant.family}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Location</span>
                            <span className="text-sm">{getOptionLabel(locations, plant.location)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Luminosity</span>
                            <span className="text-sm">{getOptionLabel(luminosities, plant.luminosity)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-medium">Mist leaves</span>
                        <span className="text-sm">{plant.mistLeaves ? "Yes" : "No"}</span>
                    </div>
                    {plant.soilType && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Soil type</span>
                            <span className="text-sm">{plant.soilType}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Watering frequency</span>
                            <span className="text-sm">{getOptionLabel(wateringFrequencies, plant.wateringFrequency)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Watering type</span>
                            <span className="text-sm">{getOptionLabel(wateringTypes, plant.wateringType)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-medium">Watering quantity</span>
                        <span className="text-sm">{plant.wateringQuantity}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-medium">Next watering date</span>
                        <span className="text-sm">{format(plant.nextWateringDate, "PPP")}</span>
                    </div>
                    {householdName && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-medium">Household</span>
                                <span className="text-sm">{householdName}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-medium">Assigned to</span>
                                <span className="text-sm">{assignedMemberName ?? "Anyone"}</span>
                            </div>
                        </div>
                    )}
                    <div className="text-muted-foreground text-xs">
                        Created: {format(plant.creationDate, "PPP")} · Last updated: {format(plant.lastUpdateDate, "PPP")}
                    </div>
                    {careSection && (
                        <>
                            <Separator />
                            {careSection}
                        </>
                    )}
                </div>
                <DialogFooter showCloseButton>
                    {wateredTodayByName ? (
                        <p className="text-muted-foreground text-sm sm:mr-auto" role="status">
                            Watered today by {wateredTodayByName}
                        </p>
                    ) : (
                        onMarkWatered && (
                            <Button variant="default" className="sm:mr-auto" onClick={onMarkWatered} disabled={isWatering} aria-busy={isWatering}>
                                <Droplets data-icon="inline-start" aria-hidden="true" />
                                {isWatering ? "Watering..." : "Mark as Watered"}
                            </Button>
                        )
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
