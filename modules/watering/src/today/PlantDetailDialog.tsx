import { format } from "date-fns";
import { Droplets } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type { HouseholdMember } from "@packages/api/entities/household";
import type { Plant } from "@packages/api/entities/plants";
import type { ResponsibilityAssignment } from "@packages/api/entities/responsibility";
import {
    Button,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    Separator
} from "@packages/components";

import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import { getOptionLabel } from "./plantUtils.ts";

const strategies = [
    { id: "fixed", label: "Fixed owner" },
    { id: "rotating", label: "Rotating" },
    { id: "unassigned", label: "Unassigned" }
] as const;

const strategyLabels: Record<string, string> = {
    fixed: "Fixed owner",
    rotating: "Rotating",
    unassigned: "Unassigned"
};

function StrategyValueDisplay({ strategy }: { strategy: string }) {
    return <span className="flex flex-1 text-left">{strategyLabels[strategy] ?? strategy}</span>;
}

function MemberValueDisplay({ memberId, members }: { memberId?: string; members: HouseholdMember[] }) {
    if (!memberId) {
        return <span className="text-muted-foreground flex flex-1 text-left">Select member</span>;
    }

    const member = members.find(m => m.id === memberId);

    return <span className="flex flex-1 text-left">{member?.userName ?? memberId}</span>;
}

interface ResponsibilitySectionProps {
    assignment?: ResponsibilityAssignment | undefined;
    members: HouseholdMember[];
    isSaving: boolean;
    onStrategyChange: (strategy: "fixed" | "rotating" | "unassigned", memberId?: string, memberName?: string) => void;
}

function ResponsibilitySection({ assignment, members, isSaving, onStrategyChange }: ResponsibilitySectionProps) {
    const serverStrategy = assignment?.strategy ?? "unassigned";
    const [localStrategy, setLocalStrategy] = useState<"fixed" | "rotating" | "unassigned">(serverStrategy);
    const currentMemberId = assignment?.assignedMemberId;

    // Sync local state when server assignment changes
    const prevServerStrategy = useRef(serverStrategy);
    if (prevServerStrategy.current !== serverStrategy) {
        prevServerStrategy.current = serverStrategy;
        setLocalStrategy(serverStrategy);
    }

    const handleStrategyChange = useCallback(
        (value: string | null) => {
            if (value === "fixed") {
                // Show member picker — don't persist yet
                setLocalStrategy("fixed");
            } else if (value === "unassigned" || value === "rotating") {
                setLocalStrategy(value);
                onStrategyChange(value);
            }
        },
        [onStrategyChange]
    );

    const handleMemberChange = useCallback(
        (value: string | null) => {
            if (!value) {
                return;
            }

            const member = members.find(m => m.id === value);

            if (member) {
                onStrategyChange("fixed", member.id, member.userName);
            }
        },
        [members, onStrategyChange]
    );

    return (
        <>
            <Separator />
            <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">Responsibility</span>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-medium">Strategy</span>
                        <Select value={localStrategy} onValueChange={handleStrategyChange} disabled={isSaving}>
                            <SelectTrigger aria-label="Responsibility strategy">
                                <StrategyValueDisplay strategy={localStrategy} />
                            </SelectTrigger>
                            <SelectContent>
                                {strategies.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {localStrategy === "fixed" && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Assigned to</span>
                            <Select value={currentMemberId ?? ""} onValueChange={handleMemberChange} disabled={isSaving}>
                                <SelectTrigger aria-label="Assigned member">
                                    <MemberValueDisplay memberId={currentMemberId} members={members} />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.userName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {assignment?.assignedMemberName && localStrategy === "fixed" && (
                        <span className="text-muted-foreground text-xs">Currently assigned to {assignment.assignedMemberName}</span>
                    )}
                </div>
            </div>
        </>
    );
}

interface PlantDetailDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMarkWatered?: () => void;
    assignment?: ResponsibilityAssignment | undefined;
    members?: HouseholdMember[] | undefined;
    isSavingAssignment?: boolean | undefined;
    onAssignmentChange?: ((strategy: "fixed" | "rotating" | "unassigned", memberId?: string, memberName?: string) => void) | undefined;
}

export function PlantDetailDialog({
    plant,
    open,
    onOpenChange,
    onMarkWatered,
    assignment,
    members,
    isSavingAssignment = false,
    onAssignmentChange
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
                    <div className="text-muted-foreground text-xs">
                        Created: {format(plant.creationDate, "PPP")} · Last updated: {format(plant.lastUpdateDate, "PPP")}
                    </div>
                    {plant.shared && onAssignmentChange && members && (
                        <ResponsibilitySection
                            assignment={assignment}
                            members={members}
                            isSaving={isSavingAssignment}
                            onStrategyChange={onAssignmentChange}
                        />
                    )}
                </div>
                <DialogFooter showCloseButton>
                    {onMarkWatered && (
                        <Button variant="default" className="sm:mr-auto" onClick={onMarkWatered}>
                            <Droplets data-icon="inline-start" aria-hidden="true" />
                            Mark as Watered
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
