import { useState, type FormEvent } from "react";

import { Badge, Button, Input, Label } from "@packages/components";

import { useHousehold, useHouseholdMembers, useCreateHousehold, useInviteMember } from "./useHousehold.ts";

function CreateHouseholdForm() {
    const [name, setName] = useState("");
    const createMutation = useCreateHousehold();

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();

        if (!trimmed) {
            return;
        }

        createMutation.mutate(trimmed);
    }

    return (
        <div className="flex flex-1 items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <h1 className="text-foreground text-2xl font-semibold">Create a Household</h1>
                <p className="text-muted-foreground text-sm">Create a household to share plant care with others.</p>
                <div className="space-y-2">
                    <Label htmlFor="household-name">Household name</Label>
                    <Input
                        id="household-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Green Thumb House"
                        autoComplete="off"
                    />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || !name.trim()}>
                    {createMutation.isPending ? "Creating..." : "Create Household"}
                </Button>
            </form>
        </div>
    );
}

function InviteMemberForm() {
    const [email, setEmail] = useState("");
    const inviteMutation = useInviteMember();

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = email.trim();

        if (!trimmed) {
            return;
        }

        inviteMutation.mutate(trimmed, {
            onSuccess: () => setEmail("")
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">Invite member</Label>
                <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    autoComplete="email"
                />
            </div>
            <Button type="submit" disabled={inviteMutation.isPending || !email.trim()}>
                {inviteMutation.isPending ? "Inviting..." : "Invite"}
            </Button>
        </form>
    );
}

function MemberList() {
    const { data: members, isPending } = useHouseholdMembers();

    if (isPending) {
        return (
            <div className="space-y-3">
                {[1, 2].map(i => (
                    <div key={i} className="bg-muted/50 h-12 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (!members || members.length === 0) {
        return <p className="text-muted-foreground text-sm">No members yet.</p>;
    }

    return (
        <div role="list" aria-label="Household members" className="border-border divide-border divide-y rounded-lg border">
            {members.map(member => (
                <div key={member.id} role="listitem" className="flex items-center justify-between px-4 py-3">
                    <span className="text-foreground text-sm font-medium">{member.userName}</span>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>{member.role}</Badge>
                </div>
            ))}
        </div>
    );
}

export function HouseholdPage() {
    const { data: household, isPending, error } = useHousehold();

    if (isPending) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <div className="bg-muted/50 h-8 w-48 animate-pulse rounded" />
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-muted/50 h-12 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-destructive text-sm" role="alert">
                    Failed to load household data. Please try again later.
                </p>
            </div>
        );
    }

    if (!household) {
        return <CreateHouseholdForm />;
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <h1 className="text-xl font-semibold">{household.name}</h1>

            <section className="flex flex-col gap-4">
                <h2 className="text-foreground text-lg font-medium">Members</h2>
                <MemberList />
            </section>

            <section className="flex flex-col gap-4">
                <InviteMemberForm />
            </section>
        </div>
    );
}
