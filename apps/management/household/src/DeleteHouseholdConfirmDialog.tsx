import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from "@packages/components";
import type { Household } from "@packages/core-module";

import { createManagementHouseholdActions } from "./householdCollection.ts";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

interface DeleteHouseholdConfirmDialogProps {
    household: Household | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteHouseholdConfirmDialog({ household, open, onOpenChange }: DeleteHouseholdConfirmDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const collection = useManagementHouseholdCollection();
    const actions = useMemo(() => createManagementHouseholdActions(collection), [collection]);

    function handleConfirm() {
        if (!household || isPending) {
            return;
        }

        setIsPending(true);

        let tx: ReturnType<typeof actions.deleteHousehold>;

        try {
            tx = actions.deleteHousehold(household.id);
        } catch {
            // The collection hasn't fully hydrated yet. Re-enable the button so
            // the user can try again rather than leaving the dialog stuck.
            setIsPending(false);

            return;
        }

        tx.isPersisted.promise
            .then(() => {
                setIsPending(false);
                onOpenChange(false);
            })
            .catch(() => {
                setIsPending(false);
            });
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && isPending) {
            return;
        }
        onOpenChange(nextOpen);
    }

    if (!household) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete household</DialogTitle>
                </DialogHeader>
                <p className="text-sm">
                    Are you sure you want to delete <strong>{household.name}</strong>? This action cannot be undone.
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isPending} aria-busy={isPending}>
                        {isPending ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
