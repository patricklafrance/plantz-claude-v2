import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from "@packages/components";
import { getAuthHeaders } from "@packages/core-module";

interface InviteMemberDialogProps {
    householdId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvited: () => void;
}

export function InviteMemberDialog({ householdId, open, onOpenChange, onInvited }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && isPending) {
            return;
        }
        if (!nextOpen) {
            setEmail("");
            setError(null);
        }
        onOpenChange(nextOpen);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!email.trim() || isPending) {
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            const response = await fetch(`/api/management/households/${householdId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ email: email.trim() })
            });

            if (response.status === 422) {
                setError("User not found. Please check the email address and try again.");
                setIsPending(false);

                return;
            }

            if (!response.ok) {
                setError("An error occurred. Please try again.");
                setIsPending(false);

                return;
            }

            setIsPending(false);
            setEmail("");
            setError(null);
            onOpenChange(false);
            onInvited();
        } catch {
            setError("An error occurred. Please try again.");
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="invite-member-form" noValidate>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="invite-email">Email *</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            placeholder="member@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={isPending}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? "invite-email-error" : undefined}
                            autoComplete="email"
                        />
                        {error && (
                            <p id="invite-email-error" role="alert" className="text-destructive text-sm">
                                {error}
                            </p>
                        )}
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" form="invite-member-form" disabled={!email.trim() || isPending} aria-busy={isPending}>
                        {isPending ? "Inviting..." : "Invite"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
