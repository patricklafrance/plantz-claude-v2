import { useState, useMemo, type FormEvent } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from "@packages/components";

import { createManagementHouseholdMemberActions } from "./householdCollection.ts";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    householdId: string;
}

export function InviteMemberDialog({ open, onOpenChange, householdId }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const collection = useManagementHouseholdCollection();
    const actions = useMemo(() => createManagementHouseholdMemberActions(collection), [collection]);

    const isValid = email.trim() !== "" && email.includes("@");

    function resetForm() {
        setEmail("");
        setIsSubmitting(false);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const tx = actions.inviteMember({ householdId, email: email.trim() });

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
                    <DialogTitle>Invite member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="invite-email">Email *</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="member@example.com"
                            aria-required="true"
                            aria-invalid={email !== "" && !isValid}
                            aria-describedby={email !== "" && !isValid ? "invite-email-error" : undefined}
                        />
                        {email !== "" && !isValid && (
                            <p id="invite-email-error" role="alert" className="text-destructive text-xs">
                                Please enter a valid email address.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? "Inviting..." : "Send invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
