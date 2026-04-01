import { useState, useMemo, type FormEvent } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from "@packages/components";

import { createManagementHouseholdActions } from "./householdCollection.ts";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

interface CreateHouseholdDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateHouseholdDialog({ open, onOpenChange }: CreateHouseholdDialogProps) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const collection = useManagementHouseholdCollection();
    const actions = useMemo(() => createManagementHouseholdActions(collection), [collection]);

    const isValid = name.trim() !== "";

    function resetForm() {
        setName("");
        setIsSubmitting(false);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const tx = actions.insertHousehold({ name: name.trim() });

        try {
            await tx.isPersisted.promise;
        } finally {
            setIsSubmitting(false);
        }

        resetForm();
        onOpenChange(false);
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create household</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="household-name">Name *</Label>
                        <Input
                            id="household-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Household name"
                            aria-required="true"
                            aria-invalid={name.trim() === "" && name !== ""}
                            aria-describedby={name.trim() === "" && name !== "" ? "household-name-error" : undefined}
                        />
                        {name.trim() === "" && name !== "" && (
                            <p id="household-name-error" role="alert" className="text-destructive text-xs">
                                Name is required.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create household"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
