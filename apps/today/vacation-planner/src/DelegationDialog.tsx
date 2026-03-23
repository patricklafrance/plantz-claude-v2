import { useState } from "react";
import { z } from "zod";

import { Button, DatePicker, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Textarea } from "@packages/components";
import type { DelegationInfo } from "@packages/core-plants/vacation";

const delegationSchema = z.object({
    helperName: z.string().min(1, "Helper name is required"),
    wateringDate: z.date({ error: "Watering date is required" }),
    notes: z.string().optional(),
});

interface DelegationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plantName: string;
    tripStartDate: Date;
    tripEndDate: Date;
    existingDelegation?: DelegationInfo;
    onSave: (delegation: DelegationInfo) => void;
}

export function DelegationDialog({ open, onOpenChange, plantName, tripStartDate, tripEndDate, existingDelegation, onSave }: DelegationDialogProps) {
    const [helperName, setHelperName] = useState(existingDelegation?.helperName ?? "");
    const [wateringDate, setWateringDate] = useState<Date | undefined>(existingDelegation?.wateringDate);
    const [notes, setNotes] = useState(existingDelegation?.notes ?? "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSave = () => {
        const result = delegationSchema.safeParse({ helperName, wateringDate, notes: notes || undefined });

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as string;
                fieldErrors[field] = issue.message;
            }
            setErrors(fieldErrors);

            return;
        }

        // Validate watering date is within trip window
        if (wateringDate && (wateringDate < tripStartDate || wateringDate > tripEndDate)) {
            setErrors({ wateringDate: "Watering date must be within your trip dates" });

            return;
        }

        setErrors({});
        onSave({
            helperName: result.data.helperName,
            wateringDate: result.data.wateringDate,
            notes: result.data.notes,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delegate Watering</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground text-sm">
                    Assign someone to water <span className="font-medium">{plantName}</span> while you are away.
                </p>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="helper-name">Helper Name</Label>
                        <Input id="helper-name" value={helperName} onChange={(e) => setHelperName(e.target.value)} placeholder="Enter helper's name" aria-invalid={!!errors.helperName} aria-describedby={errors.helperName ? "helper-name-error" : undefined} />
                        {errors.helperName && (
                            <p id="helper-name-error" className="text-destructive text-xs" role="alert">
                                {errors.helperName}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="watering-date">Watering Date</Label>
                        <DatePicker id="watering-date" value={wateringDate} onChange={setWateringDate} placeholder="Pick a date" aria-describedby={errors.wateringDate ? "watering-date-error" : undefined} />
                        {errors.wateringDate && (
                            <p id="watering-date-error" className="text-destructive text-xs" role="alert">
                                {errors.wateringDate}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
