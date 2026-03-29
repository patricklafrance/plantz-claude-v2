import { LoaderCircle } from "lucide-react";
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
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const collection = useManagementHouseholdCollection();
    const actions = useMemo(() => createManagementHouseholdActions(collection), [collection]);

    const nameError = submitted && name.trim() === "";

    function resetForm() {
        setName("");
        setSubmitted(false);
        setIsSubmitting(false);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitted(true);

        if (name.trim() === "") {
            return;
        }

        setIsSubmitting(true);

        const tx = actions.insertHousehold({ name: name.trim() });

        // Wait for the mutation to persist before closing the dialog
        tx.isPersisted.promise.then(() => {
            resetForm();
            onOpenChange(false);
        });
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && !isSubmitting) {
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
                        <Label htmlFor="create-household-name">Name *</Label>
                        <Input
                            id="create-household-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Household name"
                            disabled={isSubmitting}
                            aria-required="true"
                            aria-invalid={nameError || undefined}
                            aria-describedby={nameError ? "create-household-name-error" : undefined}
                        />
                        {nameError && (
                            <p id="create-household-name-error" role="alert" className="text-destructive text-xs">
                                Name is required.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
                            {isSubmitting ? "Creating..." : "Create household"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
