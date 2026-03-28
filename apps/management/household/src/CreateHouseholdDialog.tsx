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
    const [isPending, setIsPending] = useState(false);

    const collection = useManagementHouseholdCollection();
    const actions = useMemo(() => createManagementHouseholdActions(collection), [collection]);

    const isValid = name.trim() !== "";

    function resetForm() {
        setName("");
        setIsPending(false);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid || isPending) {
            return;
        }

        setIsPending(true);

        const tx = actions.insertHousehold({ name: name.trim() });

        tx.isPersisted.promise
            .then(() => {
                resetForm();
                onOpenChange(false);
            })
            .catch(() => {
                setIsPending(false);
            });
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
                        <Label htmlFor="create-household-name">Name *</Label>
                        <Input
                            id="create-household-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Household name"
                            aria-required="true"
                            aria-invalid={name.trim() === "" && name !== ""}
                            aria-describedby={name.trim() === "" && name !== "" ? "create-household-name-error" : undefined}
                            disabled={isPending}
                        />
                        {name.trim() === "" && name !== "" && (
                            <p id="create-household-name-error" role="alert" className="text-destructive text-xs">
                                Name is required.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid || isPending} aria-busy={isPending}>
                            {isPending ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
