import { format, formatDistanceToNow } from "date-fns";
import { Droplets } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

import type { CareEvent } from "@packages/api/entities/care-events";
import type { Plant } from "@packages/api/entities/plants";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Textarea,
    Label,
    Switch,
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    DatePicker,
    Separator
} from "@packages/components";

import { useHousehold } from "../household/useHousehold.ts";
import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import { useManagementCareEvents } from "./useManagementCareEvents.ts";
import { useUpdatePlant } from "./useManagementPlants.ts";

function CareActivitySection({ careEvents }: { careEvents: CareEvent[] }) {
    return (
        <>
            <Separator />
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Recent Activity</span>
                {careEvents.length === 0 ? (
                    <span className="text-muted-foreground text-sm">No activity yet</span>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {careEvents.map(event => (
                            <li key={event.id} className="text-muted-foreground text-sm">
                                Watered by {event.actorName} {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

interface EditPlantDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (plant: Plant) => void;
    onMarkWatered?: (plant: Plant) => void;
    /** @internal Test-only. When true, forces household membership to be truthy so the sharing toggle renders without waiting for the async hook. */
    _hasHousehold?: boolean;
    /** @internal Test-only. Pre-sets care events to skip async resolution. */
    _careEvents?: CareEvent[];
}

export function EditPlantDialog({ plant, open, onOpenChange, onDelete, onMarkWatered, _hasHousehold, _careEvents }: EditPlantDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [family, setFamily] = useState("");
    const [location, setLocation] = useState("");
    const [luminosity, setLuminosity] = useState("");
    const [mistLeaves, setMistLeaves] = useState(false);
    const [soilType, setSoilType] = useState("");
    const [wateringFrequency, setWateringFrequency] = useState("");
    const [wateringQuantity, setWateringQuantity] = useState("");
    const [wateringType, setWateringType] = useState("");
    const [shared, setShared] = useState(false);
    const [saved, setSaved] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const plantIdRef = useRef<string | null>(null);

    const updatePlant = useUpdatePlant();
    const household = useHousehold();
    const hasHousehold = _hasHousehold ?? (household.data !== undefined && household.data !== null);
    const careEventsQuery = useManagementCareEvents(plant?.shared ? plant.id : undefined);
    const careEvents = _careEvents ?? careEventsQuery.data;

    useEffect(() => {
        if (plant) {
            plantIdRef.current = plant.id;
            setName(plant.name);
            setDescription(plant.description ?? "");
            setFamily(plant.family ?? "");
            setLocation(plant.location);
            setLuminosity(plant.luminosity);
            setMistLeaves(plant.mistLeaves);
            setSoilType(plant.soilType ?? "");
            setWateringFrequency(plant.wateringFrequency);
            setWateringQuantity(plant.wateringQuantity);
            setWateringType(plant.wateringType);
            setShared(plant.shared ?? false);
            setSaved(false);
        }
    }, [plant]);

    const saveChanges = useCallback(() => {
        if (!plantIdRef.current) {
            return;
        }
        if (!name.trim() || !wateringQuantity.trim()) {
            return;
        }

        updatePlant.mutate(
            {
                id: plantIdRef.current,
                name: name.trim(),
                description: description.trim() || undefined,
                family: family.trim() || undefined,
                location,
                luminosity,
                mistLeaves,
                soilType: soilType.trim() || undefined,
                wateringFrequency,
                wateringQuantity: wateringQuantity.trim(),
                wateringType,
                shared
            },
            {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                }
            }
        );
    }, [
        name,
        description,
        family,
        location,
        luminosity,
        mistLeaves,
        soilType,
        wateringFrequency,
        wateringQuantity,
        wateringType,
        shared,
        updatePlant
    ]);

    useEffect(() => {
        if (!plant || !open) {
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            saveChanges();
        }, 500);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [
        name,
        description,
        family,
        location,
        luminosity,
        mistLeaves,
        soilType,
        wateringFrequency,
        wateringQuantity,
        wateringType,
        shared,
        plant,
        open,
        saveChanges
    ]);

    if (!plant) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>Edit plant</DialogTitle>
                        <span
                            role="status"
                            aria-live="polite"
                            className={`text-muted-foreground text-xs transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}
                        >
                            Saved
                        </span>
                    </div>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea id="edit-description" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-family">Family</Label>
                        <Input id="edit-family" value={family} onChange={e => setFamily(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-location">Location *</Label>
                            <Select
                                value={location}
                                onValueChange={v => {
                                    if (v) {
                                        setLocation(v);
                                    }
                                }}
                            >
                                <SelectTrigger id="edit-location" className="w-full" aria-required="true">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {locations.map(l => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-luminosity">Luminosity *</Label>
                            <Select
                                value={luminosity}
                                onValueChange={v => {
                                    if (v) {
                                        setLuminosity(v);
                                    }
                                }}
                            >
                                <SelectTrigger id="edit-luminosity" className="w-full" aria-required="true">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {luminosities.map(l => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Label htmlFor="edit-mist">Mist leaves *</Label>
                        <Switch id="edit-mist" checked={mistLeaves} onCheckedChange={setMistLeaves} />
                    </div>
                    {hasHousehold && (
                        <div className="flex items-center gap-3">
                            <Label htmlFor="edit-shared">Share with household</Label>
                            <Switch id="edit-shared" checked={shared} onCheckedChange={setShared} />
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-soil">Soil type</Label>
                        <Input id="edit-soil" value={soilType} onChange={e => setSoilType(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-watering-frequency">Watering frequency *</Label>
                            <Select
                                value={wateringFrequency}
                                onValueChange={v => {
                                    if (v) {
                                        setWateringFrequency(v);
                                    }
                                }}
                            >
                                <SelectTrigger id="edit-watering-frequency" className="w-full" aria-required="true">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {wateringFrequencies.map(f => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-watering-type">Watering type *</Label>
                            <Select
                                value={wateringType}
                                onValueChange={v => {
                                    if (v) {
                                        setWateringType(v);
                                    }
                                }}
                            >
                                <SelectTrigger id="edit-watering-type" className="w-full" aria-required="true">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {wateringTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-quantity">Watering quantity *</Label>
                        <Input id="edit-quantity" value={wateringQuantity} onChange={e => setWateringQuantity(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Next watering date</Label>
                        <DatePicker value={plant.nextWateringDate} disabled aria-label="Next watering date" />
                    </div>
                    <div className="text-muted-foreground text-xs">
                        Created: {format(plant.creationDate, "PPP")} · Last updated: {format(plant.lastUpdateDate, "PPP")}
                    </div>
                    {plant.shared && careEvents && <CareActivitySection careEvents={careEvents} />}
                </div>
                <DialogFooter>
                    {onMarkWatered && (
                        <Button variant="default" size="sm" className="sm:mr-auto" onClick={() => onMarkWatered(plant)}>
                            <Droplets data-icon="inline-start" aria-hidden="true" />
                            Mark as Watered
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (plant) {
                                onDelete(plant);
                            }
                        }}
                    >
                        Delete
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
