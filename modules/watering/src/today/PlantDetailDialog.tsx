import { format } from "date-fns";
import { Droplets } from "lucide-react";

import type { Plant } from "@packages/api/entities/plants";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@packages/components";

import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import { getOptionLabel } from "./plantUtils.ts";

interface PlantDetailDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMarkWatered?: () => void;
}

export function PlantDetailDialog({ plant, open, onOpenChange, onMarkWatered }: PlantDetailDialogProps) {
    if (!plant) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display tracking-tight">{plant.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {plant.description && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Description</span>
                            <span className="text-sm">{plant.description}</span>
                        </div>
                    )}
                    {plant.family && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Family</span>
                            <span className="text-sm">{plant.family}</span>
                        </div>
                    )}
                    <div className="bg-secondary/30 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Location</span>
                                <span className="text-sm">{getOptionLabel(locations, plant.location)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Luminosity</span>
                                <span className="text-sm">{getOptionLabel(luminosities, plant.luminosity)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Mist leaves</span>
                        <span className="text-sm">{plant.mistLeaves ? "Yes" : "No"}</span>
                    </div>
                    {plant.soilType && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Soil type</span>
                            <span className="text-sm">{plant.soilType}</span>
                        </div>
                    )}
                    <div className="bg-secondary/30 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Watering frequency</span>
                                <span className="text-sm">{getOptionLabel(wateringFrequencies, plant.wateringFrequency)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Watering type</span>
                                <span className="text-sm">{getOptionLabel(wateringTypes, plant.wateringType)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Watering quantity</span>
                        <span className="text-sm">{plant.wateringQuantity}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Next watering date</span>
                        <span className="text-sm">{format(plant.nextWateringDate, "PPP")}</span>
                    </div>
                    <div className="border-border/50 text-muted-foreground border-t pt-3 text-xs">
                        Created: {format(plant.creationDate, "PPP")} · Last updated: {format(plant.lastUpdateDate, "PPP")}
                    </div>
                </div>
                <DialogFooter showCloseButton>
                    {onMarkWatered && (
                        <Button
                            variant="default"
                            className="bg-botanical text-botanical-foreground hover:bg-botanical/90 sm:mr-auto"
                            onClick={onMarkWatered}
                        >
                            <Droplets data-icon="inline-start" aria-hidden="true" />
                            Mark as Watered
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
