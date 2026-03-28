import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from "@packages/components";
import { getAuthHeaders } from "@packages/core-module";

import type { MemberRow } from "./MemberList.tsx";

interface RemoveMemberConfirmDialogProps {
    member: MemberRow | null;
    householdId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRemoved: () => void;
}

export function RemoveMemberConfirmDialog({ member, householdId, open, onOpenChange, onRemoved }: RemoveMemberConfirmDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleConfirm() {
        if (!member || isPending) {
            return;
        }

        setIsPending(true);

        try {
            const response = await fetch(`/api/management/households/${householdId}/members/${member.id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                setIsPending(false);

                return;
            }

            setIsPending(false);
            onOpenChange(false);
            onRemoved();
        } catch {
            setIsPending(false);
        }
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && isPending) {
            return;
        }
        onOpenChange(nextOpen);
    }

    if (!member) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Remove member</DialogTitle>
                </DialogHeader>
                <p className="text-sm">
                    Are you sure you want to remove <strong>{member.name}</strong> from the household? They will lose access to all shared plants.
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isPending} aria-busy={isPending}>
                        {isPending ? "Removing..." : "Remove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
