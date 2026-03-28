import { useState, useEffect, useMemo, type FormEvent } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from "@packages/components";
import type { Household } from "@packages/core-module";

import { createManagementHouseholdActions } from "./householdCollection.ts";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

interface EditHouseholdDialogProps {
    household: Household | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditHouseholdDialog({ household, open, onOpenChange }: EditHouseholdDialogProps) {
    const [name, setName] = useState("");
    const [isPending, setIsPending] = useState(false);

    const collection = useManagementHouseholdCollection();
    const actions = useMemo(() => createManagementHouseholdActions(collection), [collection]);

    useEffect(() => {
        if (household) {
            setName(household.name);
            setIsPending(false);
        }
    }, [household]);

    const isValid = name.trim() !== "";

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid || isPending || !household) {
            return;
        }

        setIsPending(true);

        const tx = actions.updateHousehold({ id: household.id, name: name.trim() });

        tx.isPersisted.promise
            .then(() => {
                setIsPending(false);
                onOpenChange(false);
            })
            .catch(() => {
                setIsPending(false);
            });
    }

    if (!household) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit household</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-household-name">Name *</Label>
                        <Input
                            id="edit-household-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            aria-required="true"
                            disabled={isPending}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid || isPending} aria-busy={isPending}>
                            {isPending ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
