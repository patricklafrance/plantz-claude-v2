import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from "@packages/components";

import { sendInvitation } from "./householdCollection.ts";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    householdId: string;
    onInviteSent: () => void;
}

export function InviteMemberDialog({ open, onOpenChange, householdId, onInviteSent }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const emailEmpty = submitted && email.trim() === "";

    function resetForm() {
        setEmail("");
        setSubmitted(false);
        setIsSubmitting(false);
        setServerError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitted(true);
        setServerError(null);

        if (email.trim() === "") {
            return;
        }

        setIsSubmitting(true);

        const result = await sendInvitation(householdId, email.trim());

        if (result.error) {
            setServerError(result.error);
            setIsSubmitting(false);

            return;
        }

        resetForm();
        onOpenChange(false);
        onInviteSent();
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
                    <DialogTitle>Invite member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="invite-member-email">Email *</Label>
                        <Input
                            id="invite-member-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            disabled={isSubmitting}
                            aria-required="true"
                            aria-invalid={emailEmpty || !!serverError || undefined}
                            aria-describedby={emailEmpty ? "invite-email-error" : serverError ? "invite-server-error" : undefined}
                        />
                        {emailEmpty && (
                            <p id="invite-email-error" role="alert" className="text-destructive text-xs">
                                Email is required.
                            </p>
                        )}
                        {serverError && (
                            <p id="invite-server-error" role="alert" className="text-destructive text-xs">
                                {serverError}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
                            {isSubmitting ? "Sending..." : "Send invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
