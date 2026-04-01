import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

import {
    Button,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@packages/components";
import type { HouseholdMember } from "@packages/core-plants/household";

import type { ResponsibilityAssignment, ResponsibilityStrategy } from "./responsibilityTypes.ts";

interface AssignResponsibilityDialogProps {
    plantName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: HouseholdMember[];
    currentAssignment?: ResponsibilityAssignment | undefined;
    onSave: (strategy: ResponsibilityStrategy, assignedUserId?: string) => Promise<void>;
}

const strategyLabels: Record<ResponsibilityStrategy, string> = {
    fixed: "Fixed (one person)",
    rotating: "Rotating",
    unassigned: "Unassigned"
};

export function AssignResponsibilityDialog({ plantName, open, onOpenChange, members, currentAssignment, onSave }: AssignResponsibilityDialogProps) {
    const [strategy, setStrategy] = useState<ResponsibilityStrategy>(currentAssignment?.strategy ?? "unassigned");
    const [selectedMemberId, setSelectedMemberId] = useState<string>(currentAssignment?.assignedUserId ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const handleStrategyChange = useCallback((value: string | null) => {
        if (!value) {
            return;
        }

        setStrategy(value as ResponsibilityStrategy);

        if (value !== "fixed") {
            setSelectedMemberId("");
        }
    }, []);

    const handleSave = useCallback(async () => {
        setIsSaving(true);

        try {
            await onSave(strategy, strategy === "fixed" ? selectedMemberId || undefined : undefined);
            onOpenChange(false);
        } catch {
            // Silently handle -- the user can retry.
        } finally {
            setIsSaving(false);
        }
    }, [strategy, selectedMemberId, onSave, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Responsibility</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <p className="text-muted-foreground text-sm">
                        Set who is responsible for watering <span className="text-foreground font-medium">{plantName}</span>.
                    </p>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="strategy-select">Strategy</Label>
                        <Select value={strategy} onValueChange={handleStrategyChange}>
                            <SelectTrigger id="strategy-select">
                                <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.entries(strategyLabels) as [ResponsibilityStrategy, string][]).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {strategy === "fixed" && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="member-select">Assign to</Label>
                            <Select value={selectedMemberId} onValueChange={(value: string | null) => setSelectedMemberId(value ?? "")}>
                                <SelectTrigger id="member-select">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem key={member.userId} value={member.userId}>
                                            {member.userName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="default" onClick={handleSave} disabled={isSaving || (strategy === "fixed" && !selectedMemberId)}>
                        {isSaving ? (
                            <>
                                <Loader2 data-icon="inline-start" aria-hidden="true" className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
